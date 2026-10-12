const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const policy=require('../chatMediaPolicy'),{isValidUuid}=require('../chatMessageUtils');
const C='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',I='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',M='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const load=(supabase,picker={},File=class{})=>{
 const source=fs.readFileSync(path.join(__dirname,'../../services/chatMediaService.js'),'utf8').replace(/^import.*;\r?\n/gm,'').replace(/export const /g,'const ');
 const context={...policy,isValidUuid,supabase,DocumentPicker:picker,File};vm.createContext(context);
 vm.runInContext(source+'\nglobalThis.api={pickChatMedia,sendChatMedia,getChatMediaEnabled,getChatMediaUrl};',context);return context.api;
};
test('native picker enforces limit before read and cleans rejected cache file',async()=>{
 let deleted=0,read=0;const File=class{size=10485761;exists=true;delete(){deleted++;}bytes(){read++;throw new Error('must not read');}};
 const api=load({}, {getDocumentAsync:async(options)=>{assert.equal(options.copyToCacheDirectory,true);assert.equal(options.multiple,false);return {canceled:false,assets:[{uri:'file:///cache/big.pdf',name:'big.pdf',mimeType:'application/pdf'}]};}},File);
 await assert.rejects(api.pickChatMedia(),/10 MB/);assert.equal(read,0);assert.equal(deleted,1);
});
test('native picker cancel leaves no file or upload',async()=>{
 const api=load({}, {getDocumentAsync:async()=>({canceled:true})});assert.equal(await api.pickChatMedia(),null);
});
test('native retry finalizes once without reuploading or revalidating',async()=>{
 const calls=[];let first=true;
 const supabase={rpc:async(name)=>{calls.push(name);if(name==='create_chat_media_upload_intent')return {data:{id:I,conversation_id:C,client_message_id:M,bucket_id:'chat-media',object_path:`pending/${C}/${I}.txt`,expected_mime:'text/plain',declared_byte_size:4,file_name:'not.txt'}};
 if(first){first=false;return {error:{message:'timeout'}};}return {data:{id:M,conversation_id:C,client_message_id:M}};},
 storage:{from:()=>{throw new Error('direct storage uploads forbidden');}},functions:{invoke:async()=>{calls.push('broker');return {data:{data:{validated:true}}};}}};
 const File=class{size=4;bytes=async()=>new Uint8Array([116,101,115,116]);};
 const api=load(supabase,{},File),operation={},args={conversationId:C,clientMessageId:M,source:{uri:'file:///cache/not.txt',descriptor:policy.normalizeChatMediaFile({name:'not.txt',byteSize:4})},caption:'',operation,isCurrent:()=>true,onStage:()=>{}};
 await assert.rejects(api.sendChatMedia(args));assert.equal((await api.sendChatMedia(args)).messageId,M);
 assert.deepEqual(calls,['create_chat_media_upload_intent','broker','finalize_chat_media_message','finalize_chat_media_message']);
});
test('invalid attachment cannot request a signed URL',async()=>{
 const api=load({storage:{from:()=>{throw new Error('must not call storage');}}});
 await assert.rejects(api.getChatMediaUrl({id:M,messageKind:'file',attachment:{bucketId:'avatars'}}),/kullanılamıyor/);
});
