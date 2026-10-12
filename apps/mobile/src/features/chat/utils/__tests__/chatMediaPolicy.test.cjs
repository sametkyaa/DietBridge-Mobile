const test=require('node:test'),assert=require('node:assert/strict');
const { normalizeChatMediaFile,normalizeChatMediaAttachment }=require('../chatMediaPolicy');
const { normalizeChatMessageRow }=require('../chatMessageUtils');
const C='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',I='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',M='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const attachment={id:I,message_id:M,bucket_id:'chat-media',object_path:`pending/${C}/${I}.pdf`,mime_type:'application/pdf',byte_size:10485760,width:0,height:0,file_name:'plan.pdf',deleted_at:null};
test('mobile file MIME and extension agree with exact size limits',()=>{
 assert.equal(normalizeChatMediaFile({name:'plan.PDF',mimeType:'application/octet-stream',byteSize:10485760}).mimeType,'application/pdf');
 assert.equal(normalizeChatMediaFile({name:'video.mp4',byteSize:20971520}).kind,'video');
 for(const file of [{name:'big.pdf',byteSize:10485761},{name:'big.mp4',byteSize:20971521},{name:'bad.zip',byteSize:1},{name:'script.html',byteSize:1},{name:'wrong.pdf',mimeType:'video/mp4',byteSize:1},{name:'zero.txt',byteSize:0}])assert.throws(()=>normalizeChatMediaFile(file));
});
test('mobile attachment validates canonical bucket path message linkage size and tombstone',()=>{
 assert.equal(normalizeChatMediaAttachment(attachment,M,'file').fileName,'plan.pdf');
 for(const change of [{message_id:C},{bucket_id:'avatars'},{object_path:'https://evil.test/a.pdf'},{mime_type:'text/plain'},{byte_size:10485761},{width:1},{deleted_at:'2026-10-12'}])assert.equal(normalizeChatMediaAttachment({...attachment,...change},M,'file'),null);
 assert.equal(normalizeChatMediaAttachment(attachment,M,'video'),null);
});
test('file messages normalize through the existing canonical history path',()=>{
 const row={id:M,conversation_id:C,sender_id:I,client_message_id:M,body:null,message_kind:'file',created_at:'2026-10-12T10:00:00Z',deleted_at:null,deleted_by:null,attachment};
 const message=normalizeChatMessageRow(row,I);assert.ok(message);assert.equal(message.messageKind,'file');assert.equal(message.attachment.fileName,'plan.pdf');
 assert.equal(normalizeChatMessageRow({...row,attachment:{...attachment,bucket_id:'avatars'}},I),null);
});
