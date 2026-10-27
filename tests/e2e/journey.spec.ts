import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const fixture={category:'wifi-router',budget:{amountCents:18000,currency:'USD',includes:['device','delivery','installation']},mode:null,delivery:{requested:'tomorrow',mandatory:true},installationRequired:true,deviceModel:'Example router',technicalParameters:[{name:'model',value:'Example router',source:'image',verification:'unverified'}],imageAssessment:'readable',clarificationQuestions:['What connection does your provider use?'],summary:'UI test fixture: router replacement, $180 total.'};
test('AI result leads into requirements without locking untouched defaults',async({page})=>{
 // Explicit UI fixture only. The production adapter is never replaced; live Meta is checked separately.
 await page.route('**/api/analyze',route=>route.fulfill({json:{status:'needs_clarification',result:fixture}}));
 await page.goto('/preferences');
 await page.getByRole('button',{name:'Save and confirm preferences'}).click();
 let stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));
 expect(stored.edited).toEqual([]);
 await page.getByRole('link',{name:'Back to AI Assistant'}).click();
 await page.getByLabel('Describe your problem',{exact:true}).fill('Replace my router, total budget $180.');
 await page.getByRole('button',{name:'Analyze request',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Let’s check a few details'})).toBeVisible();
 await page.reload();
 await expect(page.getByText('UI test fixture: router replacement, $180 total.',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Review and confirm requirements'}).click();
 await expect(page.getByLabel('Maximum total budget (USD)')).toHaveValue('180');
 await expect(page.getByLabel('I confirm the technical answers')).not.toBeChecked();
 await page.getByRole('button',{name:'Save and confirm preferences'}).click();
 stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));
 expect(stored.edited).not.toContain('budgetCents');
 await page.getByRole('link',{name:'Compare solutions',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Needs verification — not confirmed recommendations'})).toBeVisible();
 await expect(page.getByText('We need a little more information',{exact:true}).first()).toBeVisible();
 await expect(page.getByRole('button',{name:/Choose this seller/})).toHaveCount(0);
});
test('expired demo schedule refresh keeps user requirements and clears choice',async({page})=>{
 await page.goto('/preferences');await expect(page.locator('#budget')).toBeVisible();
 await page.evaluate(()=>{const raw=JSON.parse(sessionStorage.getItem('matchcart-request-v1')!);raw.catalogTime='2020-01-01T12:00:00.000Z';raw.requirements.budgetCents=12345;raw.requirements.deliveryDate='2020-01-02';raw.selectedId='old-choice';sessionStorage.setItem('matchcart-request-v1',JSON.stringify(raw));});
 await page.reload();await expect(page.getByText('Your test schedule has expired',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Refresh test schedules'}).click();
 await expect(page.getByText('Your test schedule has expired',{exact:true})).toHaveCount(0);
 await expect(page.locator('#budget')).toHaveValue('123.45');
 await expect(page.locator('#deliveryDate')).toHaveValue('2020-01-02');
 const state=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));expect(state.selectedId).toBeNull();
});
test('keyboard, heading structure, labels and 200% text on main steps',async({page})=>{
 for(const path of ['/','/preferences','/comparison','/solution']){
 await page.goto(path);await expect(page.getByRole('heading',{level:1})).toBeVisible();
 const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
 expect(results.violations).toEqual([]);
 }
 await page.goto('/');await expect(page.getByLabel('Describe your problem',{exact:true})).toBeVisible();await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to main content'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();
 await page.setViewportSize({width:640,height:800});await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('API failures and malformed successful responses keep the UI usable and saved preferences intact',async({page})=>{
 for(const [status,body,type] of [[429,JSON.stringify({error:{message:'Demo quota exhausted'}}),'application/json'],[502,'<html>proxy error</html>','text/html'],[200,JSON.stringify({result:{bad:true}}),'application/json']] as const){
 await page.route('**/api/analyze',route=>route.fulfill({status,body,contentType:type}));
 await page.goto('/');await page.getByLabel('Describe your problem',{exact:true}).fill('I need a router for $150.');
 await page.getByRole('button',{name:'Analyze request',exact:true}).click();
 await expect(page.locator('main').getByRole('alert')).toBeVisible();await expect(page.locator('main').getByRole('alert')).toBeFocused();
 await expect(page.getByRole('button',{name:'Analyze request',exact:true})).toBeEnabled();
 const saved=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));expect(saved.requirements.budgetCents).toBe(15000);expect(saved.extraction).toBeNull();
 await page.unroute('**/api/analyze');
 }
});
test('a technical edit requires fresh confirmation and unsaved navigation is blocked',async({page})=>{
 await page.goto('/preferences');await page.getByText('Advanced Settings — connection details from your provider',{exact:true}).click();
 await page.locator('#protocol').selectOption('dhcp');await page.getByLabel('I confirm the technical answers').check();await page.getByRole('button',{name:'Save and confirm preferences'}).click();
 await page.getByText('Advanced Settings — connection details from your provider',{exact:true}).click();
 await page.locator('#protocol').selectOption('pppoe');await expect(page.getByLabel('I confirm the technical answers')).not.toBeChecked();
 await page.getByRole('link',{name:'Step 3: Compare solutions',exact:true}).click();
 await expect(page).toHaveURL(/preferences$/);await expect(page.locator('main').getByRole('alert')).toContainText('Save your changes');
 await page.getByRole('button',{name:'Save and confirm preferences'}).click();
 const saved=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));expect(saved.requirements.confirmed).toBe(false);
});
test('leaving the Assistant cancels a pending analysis without changing shared state',async({page})=>{
 let release!:()=>void;let started!:()=>void;let finished!:()=>void;
 const gate=new Promise<void>(resolve=>{release=resolve;});const requested=new Promise<void>(resolve=>{started=resolve;});const done=new Promise<void>(resolve=>{finished=resolve;});
 await page.route('**/api/analyze',async route=>{started();await gate;try{await route.fulfill({json:{status:'needs_clarification',result:fixture}});}catch{}finally{finished();}});
 await page.goto('/');await page.getByLabel('Describe your problem',{exact:true}).fill('Router replacement');await page.getByRole('button',{name:'Analyze request',exact:true}).click();await requested;
 await page.getByRole('link',{name:'Step 2: Confirm your needs',exact:true}).click();await expect(page).toHaveURL(/preferences$/);release();await done;
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!).extraction)).toBeNull();
});
test('a non-router AI request cannot silently produce router recommendations',async({page})=>{
 await page.route('**/api/analyze',route=>route.fulfill({json:{status:'needs_clarification',result:{...fixture,category:'other'}}}));
 await page.goto('/');await page.getByLabel('Describe your problem',{exact:true}).fill('I need a washing machine.');await page.getByRole('button',{name:'Analyze request',exact:true}).click();
 await expect(page.getByRole('link',{name:'Review and confirm requirements'})).toBeVisible();
 await page.getByRole('link',{name:'Step 3: Compare solutions',exact:true}).click();await expect(page.getByRole('heading',{name:'Please confirm this is a router request'})).toBeVisible();
 await expect(page.getByRole('button',{name:/Choose this seller/})).toHaveCount(0);
 await page.getByRole('button',{name:'Discard this analysis and set up a router request manually'}).click();
 const state=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('matchcart-request-v1')!));expect(state.extraction).toBeNull();expect(state.requirements.confirmed).toBe(false);
});

test('damaged saved state resets safely and blocked storage still allows local navigation',async({page})=>{
 await page.goto('/');await expect(page.locator('#description')).toBeVisible();await page.evaluate(()=>sessionStorage.setItem('matchcart-request-v1','broken-json'));await page.reload();await expect(page.locator('#description')).toHaveValue('');
 await page.addInitScript(()=>{Storage.prototype.getItem=function(){throw new Error('Storage denied');};Storage.prototype.setItem=function(){throw new Error('Storage denied');};});
 await page.reload();await expect(page.getByText(/storage unavailable|cannot be saved/).first()).toBeVisible();await page.locator('#description').fill('Router request without storage');
 await page.getByRole('link',{name:'Step 2: Confirm your needs',exact:true}).click();await page.getByRole('link',{name:'Back to AI Assistant'}).click();await expect(page.locator('#description')).toHaveValue('Router request without storage');
});

test('manual shopping journey is operable with the keyboard alone',async({page})=>{
 await page.goto('/');await expect(page.locator('#description')).toBeVisible();
 async function tabTo(target:ReturnType<typeof page.locator>){for(let i=0;i<100;i++){if(await target.evaluate(el=>el===document.activeElement))return;await page.keyboard.press('Tab');}throw new Error('Control is not reachable by Tab');}
 async function select(id:string,index:number){const target=page.locator('#'+id);await tabTo(target);await page.keyboard.press('Home');for(let i=0;i<index;i++)await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');}
 async function number(id:string,value:string){await tabTo(page.locator('#'+id));await page.keyboard.press('ControlOrMeta+A');await page.keyboard.type(value);}
 await tabTo(page.getByRole('link',{name:'Step 2: Confirm your needs',exact:true}));await page.keyboard.press('Enter');await expect(page.locator('#budget')).toBeVisible();
 await number('budget','150');await select('upstream',2);await select('ethernet',1);
 await tabTo(page.locator('summary').filter({hasText:'Advanced Settings'}));await page.keyboard.press('Enter');
 await select('protocol',1);await select('vlan',1);await select('ispRestrictions',1);await number('speedMbps','1000');await number('lanPorts','2');await select('band',2);await select('cable',2);
 await tabTo(page.getByLabel('I confirm the technical answers'));await page.keyboard.press('Space');
 await tabTo(page.getByRole('button',{name:'Save and confirm preferences'}));await page.keyboard.press('Enter');await expect(page.locator('form').getByRole('status')).toContainText('Preferences saved');
 await tabTo(page.getByRole('link',{name:'Compare solutions',exact:true}));await page.keyboard.press('Enter');
 const choose=page.getByRole('button',{name:'Choose this seller, delivery and Demo technician Alex',exact:true}).first();await expect(choose).toBeVisible();await tabTo(choose);await page.keyboard.press('Space');
 await tabTo(page.getByRole('link',{name:'Review selected solution'}));await page.keyboard.press('Enter');await expect(page).toHaveURL(/solution$/);await expect(page.getByText('Total including test tax',{exact:true})).toBeVisible();
});
