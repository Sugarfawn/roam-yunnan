/* Keep third-version catalogue search in the unified first step. */
(function(){
  const choices=document.querySelector('#planner-spot-choices');if(!choices)return;
  const bar=document.createElement('div');bar.className='catalogue-search';
  const label=document.createElement('label');label.htmlFor='catalogue-keyword';label.textContent='搜索景点';
  const input=document.createElement('input');input.type='search';input.id='catalogue-keyword';input.placeholder='按名称查找已收录的景点';input.maxLength=80;
  const count=document.createElement('span');count.setAttribute('role','status');count.setAttribute('aria-live','polite');
  const empty=document.createElement('p');empty.className='form-small-note';empty.hidden=true;empty.textContent='没有找到匹配的景点，试试其他名称。';
  bar.append(label,input,count);choices.before(bar);choices.after(empty);
  function filter(){let matches=0;const rows=[...choices.querySelectorAll('.planner-choice-row')],keyword=input.value.trim().toLocaleLowerCase();for(const row of rows){const name=row.querySelector('.choice-copy strong')?.textContent||'';row.hidden=!name.toLocaleLowerCase().includes(keyword);if(!row.hidden)matches++;}count.textContent=matches+' / '+rows.length;empty.hidden=matches>0;}
  input.addEventListener('input',filter);input.addEventListener('keydown',event=>{if(event.key==='Enter')event.preventDefault();});
  document.querySelector('#plan-area').addEventListener('change',()=>{input.value='';filter();});
  new MutationObserver(filter).observe(choices,{childList:true});filter();
})();
