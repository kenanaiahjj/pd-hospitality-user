import PreviewClient from './client';
export default async function PreviewPage({searchParams}:{searchParams:Promise<{__component?:string;__state?:string}>}) {
  const query=await searchParams;
  return <PreviewClient component={query.__component} state={query.__state}/>;
}
