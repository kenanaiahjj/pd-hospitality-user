'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CATALOG, resolveSpecimen } from './catalog';
import inventory from './inventory.json';
import './workbench.css';

const subscribe=(listener:()=>void)=>{window.addEventListener('popstate',listener);window.addEventListener('states:url',listener);return()=>{window.removeEventListener('popstate',listener);window.removeEventListener('states:url',listener);};};
const snapshot=()=>window.location.search;
const serverSnapshot=()=>'';
const urlFor=(id:string,state:string,preview=false)=>`${preview?'/states/preview':'/states'}?__component=${encodeURIComponent(id)}&__state=${encodeURIComponent(state)}`;
export default function StatesPage(){
  const search=useSyncExternalStore(subscribe,snapshot,serverSnapshot);
  const params=new URLSearchParams(search);
  const {item,preset}=resolveSpecimen(params.get('__component'),params.get('__state'));
  const [filter,setFilter]=useState('');
  const [hidden,setHidden]=useState(false);
  const [width,setWidth]=useState(390);
  const [seed,setSeed]=useState(urlFor(CATALOG[0].id,CATALOG[0].states[0].id,true));
  const [revision,setRevision]=useState(0);
  const [copied,setCopied]=useState(false);
  const frame=useRef<HTMLIFrameElement>(null);
  const active=useRef<HTMLButtonElement>(null);
  const choose=useCallback((id:string,state:string)=>{
    const next=resolveSpecimen(id,state);
    window.history.pushState(null,'',urlFor(next.item.id,next.preset.id));
    window.dispatchEvent(new Event('states:url'));
    setSeed(urlFor(next.item.id,next.preset.id,true));setRevision(r=>r+1);
  },[]);
  useEffect(()=>{
    const restore=()=>{const p=new URLSearchParams(location.search);const next=resolveSpecimen(p.get('__component'),p.get('__state'));setSeed(urlFor(next.item.id,next.preset.id,true));setRevision(r=>r+1);};
    restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);
  },[]);
  const key=useCallback((pressed:string)=>{
    if(pressed.toLowerCase()==='h'){setHidden(h=>!h);return;}
    const step=['ArrowDown','ArrowRight'].includes(pressed)?1:['ArrowUp','ArrowLeft'].includes(pressed)?-1:0;
    if(step){const i=item.states.findIndex(s=>s.id===preset.id);choose(item.id,item.states[(i+step+item.states.length)%item.states.length].id);}
  },[item,preset,choose]);
  useEffect(()=>{
    const handle=(event:KeyboardEvent)=>{
      if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      const target=event.target as HTMLElement;
      if(target.isContentEditable||target.closest('input,textarea,select'))return;
      if(['h','H','ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();key(event.key);}
    };
    window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
  },[key]);
  useEffect(()=>{
    const handle=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==frame.current?.contentWindow)return;
      if(event.data?.type==='states:key'&&typeof event.data.key==='string')key(event.data.key);
      if(event.data?.type==='states:transition'&&typeof event.data.state==='string'&&item.states.some(s=>s.id===event.data.state)){
        window.history.replaceState(null,'',urlFor(item.id,event.data.state));window.dispatchEvent(new Event('states:url'));
      }
    };
    window.addEventListener('message',handle);return()=>window.removeEventListener('message',handle);
  },[item,key]);
  useEffect(()=>{active.current?.scrollIntoView({block:'nearest',behavior:'instant'});},[item.id,preset.id]);
  const groups=Array.from(new Set(CATALOG.map(c=>c.group)));
  const stateGroups=Array.from(new Set(item.states.map(s=>s.group)));
  const filtered=CATALOG.filter(c=>`${c.name} ${c.group} ${c.source}`.toLowerCase().includes(filter.toLowerCase()));
  return <main className="states-workbench" data-workbench-hidden={hidden}>
    <script id="states-manifest" type="application/json" dangerouslySetInnerHTML={{__html:JSON.stringify(CATALOG).replaceAll('<','\\u003c')}}/>
    <header className="states-header" hidden={hidden}>
      <div><Link href="/">Cabana / workbench</Link><h1>Component states</h1><p>Real components. Controlled fixtures. A removable playground.</p></div>
      <div className="states-header-actions"><span>{CATALOG.length} entries · {CATALOG.reduce((n,c)=>n+c.states.length,0)} presets</span><Link href="/components">Original gallery ↗</Link><button onClick={()=>{navigator.clipboard.writeText(location.href).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>setCopied(false));}}>{copied?'Link copied':'Copy state link'}</button></div>
    </header>
    <div className="states-layout">
      <aside className="states-catalog" hidden={hidden}>
        <label>Find a component<input type="search" placeholder="Cards, controls, chat…" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
        <nav aria-label="Components">{groups.map(group=><section key={group}><h2>{group}<span>{filtered.filter(c=>c.group===group).length}</span></h2>{filtered.filter(c=>c.group===group).map(c=><a key={c.id} href={urlFor(c.id,c.states[0].id)} aria-current={c.id===item.id?'page':undefined} onClick={e=>{e.preventDefault();choose(c.id,c.states[0].id);}}><span>{c.name}</span><small>{c.states.length}</small></a>)}</section>)}{!filtered.length&&<p>No matching components.</p>}</nav>
        <details><summary>Coverage and limits</summary><p>{inventory.length} exported components inventoried. UI library and guest primitives are isolated. Screen compositions keep their internal components in context.</p><p>No missing production branch has been invented. Interactive sub-states can still be reached inside previews. This is a curated catalog, not a GitHub scanner.</p><ul>{inventory.filter(c=>!CATALOG.some(x=>x.name===c.name||x.id===c.name)).map(c=><li key={c.source+c.name}><b>{c.name}</b><small>{c.source}</small><span>Not isolated; inspect in its screen context.</span></li>)}</ul></details>
      </aside>
      <section className="states-center" aria-label="Component preview">
        <div className="states-stage-heading" hidden={hidden}><div><h2>{item.name}</h2><code>{item.source}</code></div><label>Viewport<select value={width} onChange={e=>setWidth(Number(e.target.value))}><option value={390}>Phone · 390</option><option value={480}>Wide phone · 480</option><option value={768}>Tablet · 768</option></select></label></div>
        <div className="states-stage" style={{maxWidth:width}}><iframe key={revision} ref={frame} title={`${item.name} preview`} src={seed}/></div>
        <p className="states-stage-note" hidden={hidden}>{item.note??'Production component with fixture props. Use the controls inside the preview to interact.'}</p>
      </section>
      <aside className="states-inspector" hidden={hidden}>
        <h2>States <span>{item.states.length}</span></h2>
        <p className="states-help">↑ ↓ switch · H hide controls</p>
        <nav aria-label="States">{stateGroups.map(group=><div role="group" aria-labelledby={`group-${group.replaceAll(' ','-')}`} key={group}><h3 id={`group-${group.replaceAll(' ','-')}`}>↳ {group}</h3>{item.states.filter(s=>s.group===group).map(s=><button ref={s.id===preset.id?active:undefined} type="button" key={s.id} aria-pressed={preset.id===s.id} onClick={()=>choose(item.id,s.id)}>{s.label}</button>)}</div>)}</nav>
        <label className="states-select">State<select value={preset.id} onChange={e=>choose(item.id,e.target.value)}>{stateGroups.map(group=><optgroup label={group} key={group}>{item.states.filter(s=>s.group===group).map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</optgroup>)}</select></label>
        <div className="states-fixture-meta"><h3>Selected fixture</h3><pre>{JSON.stringify({component:item.id,state:preset.id,source:item.source},null,2)}</pre><p>Picking a preset resets the preview. Booking events advance the real engine and update the URL.</p><button onClick={()=>{setSeed(urlFor(item.id,preset.id,true));setRevision(r=>r+1);}}>Reset this state</button></div>
      </aside>
    </div>
    {hidden&&<button className="states-reveal" onClick={()=>setHidden(false)}>Show controls · H</button>}
  </main>;
}
