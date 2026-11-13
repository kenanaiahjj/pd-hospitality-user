'use client';
import { useEffect } from 'react';
import { resolveSpecimen } from '../catalog';
import { PreviewBoundary, SpecimenPreview } from '../specimens';
export default function PreviewClient({ component, state }: { component?:string; state?:string }){
  const {item,preset}=resolveSpecimen(component??null,state??null);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
      const target=e.target as HTMLElement;
      if(target.isContentEditable||target.closest('input,textarea,select'))return;
      if(['h','H','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)&&window.parent!==window){e.preventDefault();window.parent.postMessage({type:'states:key',key:e.key},location.origin);}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);
  return <PreviewBoundary key={`${item.id}:${preset.id}`}><SpecimenPreview key={`${item.id}:${preset.id}`} item={item} state={preset.id} onState={next=>{if(window.parent!==window)window.parent.postMessage({type:'states:transition',state:next},location.origin);}}/></PreviewBoundary>;
}
