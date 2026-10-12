const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const lifecycle=require('../chatScrollLifecycle');
// Execute the actual FlatList component with deterministic native layout and frame events.
const harness=()=>{
 const slots=[],effects=[],frames=new Map();let cursor=0,nextFrame=0,scrolls=0;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>Object.is(value,b[index]));
 const React={createElement:(type,props,...children)=>({type,props:props||{},children}),Fragment:'Fragment',
  useRef:value=>{const index=cursor++;return slots[index]??=( {current:value});},
  useState:value=>{cursor++;return [value,()=>{}];},
  useCallback:(callback,deps)=>{const index=cursor++;if(!same(slots[index]?.deps,deps))slots[index]={deps,callback};return slots[index].callback;},
  useEffect:(callback,deps)=>{const index=cursor++;if(!same(slots[index]?.deps,deps)){effects.push(()=>{slots[index]?.cleanup?.();slots[index]={deps,cleanup:callback()};});}},
 };
 const source=fs.readFileSync(path.join(__dirname,'../../components/ChatMessageList.js'),'utf8');
 const compiled=ts.transpileModule(source,{fileName:'ChatMessageList.jsx',compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 const module={exports:{}};
 vm.runInNewContext(compiled,{module,exports:module.exports,require:name=>{
  if(name==='react')return {...React,default:React};
  if(name==='react-native')return {FlatList:'FlatList',View:'View',Text:'Text',StyleSheet:{create:styles=>styles}};
  if(name.endsWith('chatScrollLifecycle'))return lifecycle;
  if(name.endsWith('/theme'))return {colors:{},spacing:{},typography:{}};
  return {};
 },requestAnimationFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id),setTimeout,clearTimeout});
 const find=node=>node?.type==='FlatList'?node:node?.children?.map(find).find(Boolean);
 let props={messages:[],isInitialLoading:false,initialPositionToken:1,conversationId:'test-conversation',isScreenFocused:true};
 const render=changes=>{props={...props,...changes};cursor=0;const list=find(module.exports.default(props));if(list)list.props.ref.current={scrollToEnd:()=>scrolls++};while(effects.length)effects.shift()();return list?.props;};
 const frame=()=>{const pending=[...frames.values()];frames.clear();pending.forEach(callback=>callback());};
 return {render,frame,count:()=>scrolls};
};
test('initial messages arriving after layout still open at the latest message',()=>{
 const h=harness();let list=h.render();list.onLayout({nativeEvent:{layout:{height:600}}});list.onContentSizeChange(390,2000);h.frame();assert.equal(h.count(),0);
 list=h.render({messages:[{id:'one'}]});h.frame();assert.equal(h.count(),1);
});
test('chat tab re-entry restores latest position without fighting the user scrolling older messages',()=>{
 const h=harness();let list=h.render({messages:[{id:'one'}]});list.onLayout({nativeEvent:{layout:{height:600}}});list.onContentSizeChange(390,2000);h.frame();const initial=h.count();assert.ok(initial>0);
 list.onScrollBeginDrag();list=h.render({messages:[{id:'one'},{id:'two'}]});h.frame();assert.equal(h.count(),initial);
 h.render({isScreenFocused:false});h.render({isScreenFocused:true});h.frame();assert.ok(h.count()>initial);
});
test('a scheduled initial scroll is canceled when the chat loses focus',()=>{
 const h=harness();let list=h.render({messages:[{id:'one'}]});list.onLayout({nativeEvent:{layout:{height:600}}});list.onContentSizeChange(390,2000);
 h.render({isScreenFocused:false});h.frame();assert.equal(h.count(),0);
});
