import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import {newState} from '../../src/state/requirements-store';
import type {Requirements} from '../../src/domain/requirements';
const anchor='2026-10-27T16:00:00.000Z';
const screenshot={fullPage:true,animations:'disabled' as const};
async function seed(page:Page,patch:Partial<Requirements>={}){
 await page.clock.setFixedTime(new Date(anchor));await page.goto('/');await expect(page.locator('#description')).toBeVisible();
 const state=newState(anchor);Object.assign(state.requirements,{protocol:'dhcp',upstream:'ont',ethernet:'yes',vlan:'not-required',ispRestrictions:'none',speedMbps:1000,lanPorts:2,band:'5',cable:'need',confirmed:true,deliveryDate:'2026-10-28',deliveryMandatory:true,installationDate:'2026-10-28',installationMandatory:true},patch);
 await page.evaluate(s=>sessionStorage.setItem('matchcart-request-v1',JSON.stringify(s)),state);
}
async function accessible(page:Page){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(result.violations).toEqual([]);}
async function fits(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);}
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
 test('visual assistant and preferences / '+viewport.name,async({page})=>{
 await page.setViewportSize(viewport);await page.clock.setFixedTime(new Date(anchor));await page.goto('/');await expect(page.locator('#description')).toBeVisible();await fits(page);await accessible(page);await expect(page).toHaveScreenshot('assistant-'+viewport.name+'.png',screenshot);
 await page.getByRole('link',{name:'Step 2: Confirm your needs',exact:true}).click();await expect(page.locator('#budget')).toBeVisible();await fits(page);await expect(page).toHaveScreenshot('preferences-'+viewport.name+'.png',screenshot);
 });
 for(const scenario of ['happy','unknown','budget','incompatible'] as const)test('visual '+scenario+' / '+viewport.name,async({page})=>{
 await page.setViewportSize(viewport);await seed(page,scenario==='unknown'?{protocol:'unknown'}:scenario==='budget'?{budgetCents:5000}:scenario==='incompatible'?{band:'6'}:{});await page.goto('/comparison');await expect(page.locator('.comparison-toolbar')).toBeVisible();await fits(page);await accessible(page);
 if(scenario==='happy'){await expect(page.getByText('$135.16',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Choose this plan/})).toHaveCount(2);}
 else {await expect(page.getByRole('button',{name:/Choose this plan/})).toHaveCount(0);if(scenario==='unknown')await expect(page.locator('.status-needs_verification')).toHaveCount(2);else if(scenario==='incompatible')await expect(page.locator('.status-incompatible').first()).toBeVisible();else await expect(page.getByText('The complete cost is above your saved budget for some options.',{exact:false})).toBeVisible();}
 await expect(page).toHaveScreenshot(scenario+'-'+viewport.name+'.png',screenshot);
 if(scenario==='happy'){await page.getByRole('button',{name:/Choose this plan.*Demo technician Alex/}).click();await page.getByRole('link',{name:'Review selected solution'}).click();await expect(page.locator('.plan-aside')).toBeVisible();await fits(page);await accessible(page);await expect(page).toHaveScreenshot('complete-'+viewport.name+'.png',screenshot);}
 });
}
test('320px reflow with 200% and 400% text, reduced motion and visible focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:800});await seed(page);
 await page.goto('/comparison');await page.getByRole('button',{name:/Choose this plan.*Demo technician Alex/}).click();await page.getByRole('link',{name:'Review selected solution'}).click();await expect(page.locator('.plan-aside')).toBeVisible();
 for(const route of ['/','/preferences','/comparison','/solution'])for(const scale of ['200%','400%']){
 await page.goto(route);await expect(page.getByRole('heading',{level:1})).toBeVisible();await page.evaluate(value=>{document.documentElement.style.fontSize=value;},scale);await fits(page);
 }
 await page.goto('/');await expect(page.locator('#description')).toBeVisible();await page.locator('#description').focus();const focus=await page.locator('#description').evaluate(el=>{const style=getComputedStyle(el);return {width:style.outlineWidth,style:style.outlineStyle,transition:style.transitionDuration};});expect(focus.width).toBe('3px');expect(focus.style).toBe('solid');expect(focus.transition).toBe('0s');
});
test('photo preview is local, removable, and the processing and review states are accessible',async({page})=>{
 await page.clock.setFixedTime(new Date(anchor));let calls=0;let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 const fixture={category:'wifi-router',budget:{amountCents:15000,currency:'USD',includes:['device','delivery','installation']},mode:null,delivery:{requested:'tomorrow',mandatory:true},installationRequired:true,deviceModel:null,technicalParameters:[],imageAssessment:'uncertain',clarificationQuestions:['Please provide a clear model-label photo.'],summary:'UI-only fixture: router request requiring confirmation.'};
 await page.route('**/api/analyze',async route=>{calls++;await gate;await route.fulfill({json:{status:'needs_clarification',result:fixture}});});await page.goto('/');await page.locator('#description').fill('Router replacement with delivery and installation.');const buffer=await sharp({create:{width:80,height:60,channels:3,background:'gray'}}).png().toBuffer();
 await page.locator('#photo').setInputFiles({name:'test-device.png',mimeType:'image/png',buffer});await expect(page.getByAltText('Your selected device photo')).toBeVisible();expect(calls).toBe(0);await page.getByRole('button',{name:'Remove photo'}).click();await expect(page.getByAltText('Your selected device photo')).toHaveCount(0);
 await page.locator('#photo').setInputFiles({name:'test-device.png',mimeType:'image/png',buffer});await page.getByRole('button',{name:'Analyze request',exact:true}).click();await expect(page.getByRole('button',{name:'Analyzing with Meta…',exact:true})).toBeDisabled();await expect(page.locator('form')).toHaveAttribute('aria-busy','true');await accessible(page);await expect(page).toHaveScreenshot('assistant-loading-desktop.png',screenshot);release();await expect(page.locator('.requirements-summary')).toBeVisible();await expect(page.getByText('Model not yet identified',{exact:true})).toBeVisible();await expect(page.locator('.result-panel')).toBeFocused();await accessible(page);await expect(page).toHaveScreenshot('assistant-review-desktop.png',screenshot);const stored=await page.evaluate(()=>sessionStorage.getItem('matchcart-request-v1'));expect(stored).not.toContain('blob:');expect(stored).not.toContain('test-device.png');
});

test('tablet layout has no overflow on all steps',async({page})=>{
 await page.setViewportSize({width:820,height:1180});await seed(page);for(const route of ['/','/preferences','/comparison','/solution']){await page.goto(route);await expect(page.getByRole('heading',{level:1})).toBeVisible();await fits(page);}
});
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}])test('visual API error / '+viewport.name,async({page})=>{
 await page.setViewportSize(viewport);await page.clock.setFixedTime(new Date(anchor));await page.route('**/api/analyze',route=>route.fulfill({status:429,json:{error:{message:'The shared demo AI quota is exhausted. You can still enter your requirements manually.'}}}));await page.goto('/');await page.locator('#description').fill('Help me replace my router within $150.');await page.getByRole('button',{name:'Analyze request',exact:true}).click();await expect(page.locator('main').getByRole('alert')).toBeFocused();await fits(page);await accessible(page);await expect(page).toHaveScreenshot('error-'+viewport.name+'.png',screenshot);
});

test('step navigation moves focus to the new heading while topic links focus their field',async({page})=>{
 await page.goto('/');await expect(page.locator('#description')).toBeVisible();await page.getByRole('link',{name:'Step 2: Confirm your needs',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toBeFocused();await page.getByRole('link',{name:'Step 3: Compare solutions',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toBeFocused();await page.goto('/preferences#protocol');await expect(page.locator('#protocol')).toBeFocused();
});
