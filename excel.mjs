import {fromRows,fromTimetable} from './core.mjs';
export async function importExcel(buffer){
 if(!globalThis.JSZip)throw Error('Excel读取组件未加载，请刷新后重试');
 const zip=await JSZip.loadAsync(buffer);const entries=Object.values(zip.files);if(entries.length>3000||entries.reduce((n,e)=>n+(e._data?.uncompressedSize||0),0)>30*1024*1024)throw Error('Excel内容过大');
 const parse=s=>{const d=new DOMParser().parseFromString(s,'application/xml');if(d.querySelector('parsererror'))throw Error('Excel XML格式无效');return d;};
 let strings=[];const shared=zip.file('xl/sharedStrings.xml');if(shared)strings=[...parse(await shared.async('string')).getElementsByTagName('si')].map(n=>[...n.getElementsByTagName('t')].map(t=>t.textContent).join(''));
 const col=s=>{let n=0;for(const c of s)n=n*26+c.charCodeAt(0)-64;return n-1;};let best={courses:[],warnings:[]};
 const sheets=entries.filter(e=>/^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).slice(0,20);if(!sheets.length)throw Error('不是有效的.xlsx文件');
 for(const file of sheets){const doc=parse(await file.async('string'));const rows=[];
  for(const row of doc.getElementsByTagName('row')){const y=Number(row.getAttribute('r'))-1;if(y<0||y>1000)continue;rows[y]??=[];for(const cell of row.getElementsByTagName('c')){const ref=cell.getAttribute('r')||'';const x=col(ref.match(/^[A-Z]+/)?.[0]||'A');if(x>80)continue;const raw=cell.getElementsByTagName('v')[0]?.textContent||'';rows[y][x]=cell.getAttribute('t')==='s'?(strings[Number(raw)]||''):cell.getAttribute('t')==='inlineStr'?[...cell.getElementsByTagName('t')].map(n=>n.textContent).join(''):raw;}}
  for(const merge of doc.getElementsByTagName('mergeCell')){const m=(merge.getAttribute('ref')||'').match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);if(!m)continue;const x1=col(m[1]),y1=Number(m[2])-1,x2=Math.min(col(m[3]),80),y2=Math.min(Number(m[4])-1,1000);const value=rows[y1]?.[x1]||'';for(let y=y1;y<=y2;y++){rows[y]??=[];for(let x=x1;x<=x2;x++)rows[y][x]=value;}}
  for(let y=0;y<rows.length;y++)rows[y]??=[];
  for(const fn of [fromRows,fromTimetable]){const result=fn(rows);if(result.courses.length>best.courses.length)best=result;}
 }
 return best.courses.length?best:{courses:[],warnings:['未找到可识别的课程表。请检查是否包含课程、星期、节次、周次，或按CSV模板整理。']};
}
