import {normalizeSettings,normalizeCourse} from './core.mjs';
export function encodeTransfer(data){
 const bytes=new TextEncoder().encode(JSON.stringify(data));
 if(bytes.length>65536)throw Error('分享课表过大，请使用JSON备份文件');
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return '#import='+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeTransfer(fragment){
 if(!fragment.startsWith('#import='))return null;
 const encoded=fragment.slice(8);if(encoded.length>90000||!encoded||!/^[\w-]+$/.test(encoded))throw Error('课表导入链接无效');
 let data;try{const binary=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('课表导入链接已损坏，请使用JSON备份重新导入');}
 if(!Array.isArray(data.courses)||data.courses.length>1000)throw Error('导入链接中的课程数据无效');
 return {version:1,settings:normalizeSettings(data.settings),courses:data.courses.map(normalizeCourse)};
}
