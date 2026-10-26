export const SCHOOL_LOGIN = 'https://i.njupt.edu.cn/user-login/user/login?service=7A300D09F4D78382E3DF4B6E581EBAFF';
export const TIMES = [['08:00','08:45'],['08:50','09:35'],['09:50','10:35'],['10:40','11:25'],['11:30','12:15'],['13:45','14:30'],['14:35','15:20'],['15:35','16:20'],['16:25','17:10'],['18:30','19:15'],['19:25','20:10'],['20:20','21:05'],['21:35','22:20'],['21:45','22:30']];
export const COLORS = ['blue','amber','orange','rose','pink','teal','violet'];
// The public application contains no personal courses. Import locally to begin.
export const seed = () => ({version:1,settings:{semester:'2026—2027 学年 · 秋季学期',startDate:'2026-08-31',totalWeeks:20,showWeekend:false,lastSlot:12,theme:'light',times:TIMES.map(t=>[...t]),inferredStart:false},courses:[]});
export function dateNumber(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('日期格式应为 YYYY-MM-DD');const [y,m,d]=s.split('-').map(Number);const n=Date.UTC(y,m-1,d);if(new Date(n).toISOString().slice(0,10)!==s)throw Error('日期无效');return n;}
export function addDays(s,n){return new Date(dateNumber(s)+n*86400000).toISOString().slice(0,10);}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function weekFor(date,start){return Math.floor((dateNumber(date)-dateNumber(start))/604800000)+1;}
export function parseWeeks(value){
 if(Array.isArray(value)){const a=[...new Set(value.map(Number))].sort((a,b)=>a-b);if(!a.length||a.some(n=>!Number.isInteger(n)||n<1||n>40))throw Error('周次必须在1—40周之间');return a;}
 let s=String(value??'').normalize('NFKC').trim();if(!s)throw Error('请填写上课周次，例如1-16或1-16(单)');
 const odd=/单|odd/i.test(s),even=/双|even/i.test(s);if(odd&&even)throw Error('单双周请分开填写');
 s=s.replace(/[第周\s()（）]|单|双|odd|even/gi,'').replace(/[、，;]/g,',').replace(/[~～至—–]/g,'-');
 if(!/^\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/.test(s))throw Error('无法识别周次：'+value);
 let result=[];for(const chunk of s.split(',')){let [a,b=a]=chunk.split('-').map(Number);if(a<1||b>40||a>b)throw Error('周次范围无效：'+value);for(let n=a;n<=b;n++)if((!odd||n%2)&&(!even||n%2===0))result.push(n);}
 if(!result.length)throw Error('周次不能为空');return [...new Set(result)].sort((a,b)=>a-b);
}
export function weekLabel(weeks){const a=parseWeeks(weeks);let out=[],start=a[0],last=start;for(let i=1;i<=a.length;i++){if(a[i]===last+1){last=a[i];continue;}out.push(start===last?`${start}`:`${start}—${last}`);start=last=a[i];}return out.join('、')+'周';}
export function normalizeCourse(raw,i=0){
 const name=String(raw.name??'').trim(),day=Number(raw.day),start=Number(raw.start),end=Number(raw.end??raw.start);
 if(!name||name.length>100)throw Error('课程名称不能为空且不超过100字');
 if(!Number.isInteger(day)||day<1||day>7)throw Error(name+'：星期应为1—7');
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>14||end<start)throw Error(name+'：节次范围应为1—14');
 return {id:String(raw.id||globalThis.crypto?.randomUUID?.()||`c-${Date.now()}-${i}`),name,day,start,end,weeks:parseWeeks(raw.weeks),room:String(raw.room??'').slice(0,100),teacher:String(raw.teacher??'').slice(0,60),color:COLORS.includes(raw.color)?raw.color:COLORS[i%COLORS.length],notes:String(raw.notes??'').slice(0,2000),needsReview:Boolean(raw.needsReview),source:String(raw.source??'本地导入').slice(0,100)};
}
export function normalizeSettings(raw={}){const base=seed().settings;const s={...base,...raw};dateNumber(s.startDate);if(new Date(dateNumber(s.startDate)).getUTCDay()!==1)throw Error('第1周开始日期应为周一');s.totalWeeks=Number(s.totalWeeks);if(!Number.isInteger(s.totalWeeks)||s.totalWeeks<1||s.totalWeeks>40)throw Error('学期周数应为1—40');s.lastSlot=Number(s.lastSlot);if(!Number.isInteger(s.lastSlot)||s.lastSlot<1||s.lastSlot>14)throw Error('显示节数应为1—14');s.semester=String(s.semester).slice(0,100);s.showWeekend=Boolean(s.showWeekend);s.theme=s.theme==='dark'?'dark':'light';if(!Array.isArray(s.times)||s.times.length!==14)throw Error('需要14节的作息时间');s.times=s.times.map((t,i)=>{if(!Array.isArray(t)||t.length!==2||t.some(v=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))||t[0]>=t[1])throw Error('第'+(i+1)+'节时间无效');return [...t];});return s;}
export function conflicts(courses){const result=[];for(let i=0;i<courses.length;i++)for(let j=i+1;j<courses.length;j++){const a=courses[i],b=courses[j];if(a.day===b.day&&a.start<=b.end&&b.start<=a.end&&a.weeks.some(w=>b.weeks.includes(w)))result.push([a.id,b.id]);}return result;}
export function parseDelimited(text){
 const delimiter=text.split('\n')[0].includes('\t')?'\t':',';let rows=[],row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('表格中有未闭合的引号');row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows;
}
const headerAliases={name:['课程名称','课程','科目','name'],day:['星期','星期几','周几','上课星期','day'],start:['开始节次','起始节次','开始节','start'],end:['结束节次','结束节','end'],slots:['节次','上课节次','slots'],weeks:['周次','上课周次','教学周','weeks'],room:['教室','上课地点','地点','room','location'],teacher:['教师','任课教师','老师','teacher']};
function weekday(value){let s=String(value).trim().replace(/星期|周/g,'');if(s==='日'||s==='天')return 7;return '一二三四五六'.includes(s)&&s.length===1?'一二三四五六'.indexOf(s)+1:Number(s);}
export function fromRows(rows){
 const warnings=[],courses=[];let header=-1,columns={};
 for(let i=0;i<Math.min(rows.length,15);i++){const map={};for(const [key,aliases]of Object.entries(headerAliases)){const n=rows[i].findIndex(c=>aliases.includes(String(c).trim()));if(n>=0)map[key]=n;}if(map.name!==undefined&&map.day!==undefined&&(map.start!==undefined||map.slots!==undefined)){header=i;columns=map;break;}}
 if(header<0)return {courses:[],warnings:['未识别到课程明细表表头，需要课程名称、星期、节次、周次列。']};
 for(let i=header+1;i<rows.length;i++){const r=rows[i];if(!r[columns.name])continue;try{const get=k=>columns[k]===undefined?'':r[columns[k]]??'';const slots=String(get('slots')).match(/\d+/g)?.map(Number)||[];let weeks=get('weeks');if(!weeks)throw Error('缺少周次，请补充后导入');courses.push(normalizeCourse({name:get('name'),day:weekday(get('day')),start:get('start')||slots[0],end:get('end')||slots.at(-1)||get('start'),weeks,room:get('room'),teacher:get('teacher')},courses.length));}catch(e){warnings.push('第'+(i+1)+'行：'+e.message);}}
 return {courses,warnings};
}
export function extractTables(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 // Parse only inert text nodes; never inject imported HTML into the application.
 doc.querySelectorAll('script,style,iframe,img,link,object,embed').forEach(e=>e.remove());
 return [...doc.querySelectorAll('table')].map(table=>{let rows=[];[...table.rows].forEach((tr,y)=>{rows[y]??=[];let x=0;for(const td of tr.cells){while(rows[y][x]!==undefined)x++;const text=td.innerHTML.replace(/<br\s*\/?\s*>/gi,'\n');const box=doc.createElement('div');box.innerHTML=text;const content=box.textContent.trim();for(let dy=0;dy<Math.min(td.rowSpan||1,30);dy++){rows[y+dy]??=[];for(let dx=0;dx<Math.min(td.colSpan||1,15);dx++)rows[y+dy][x+dx]=content;}x+=td.colSpan||1;}});return rows;});
}
function parseCell(text,day,slot,i){
 const clean=String(text).replace(/\r/g,'').trim();const wm=clean.match(/(?:第)?(\d+(?:\s*[-~～—至]\s*\d+)?(?:\s*[,，、]\s*\d+(?:\s*[-~～—至]\s*\d+)?)*)\s*周(?:\s*[（(]?[单双][）)]?)?/);
 if(!wm)return null;
 const sm=clean.match(/(?:第|\[|【|\()?\s*(\d{1,2})(?:\s*[-~～—至,，]\s*(\d{1,2}))?\s*[\]】)]?\s*节/);
 let lines=clean.split('\n').map(v=>v.trim()).filter(Boolean),nameLine=lines.find(v=>!/^\d+[-~]/.test(v)&&!v.includes('周')&&!/^第?\d.*节/.test(v)&&!/^教师|^教室|^地点/.test(v));
 let name=(clean.match(/课程(?:名称)?[：:]\s*([^\n]+)/)||[])[1]||nameLine;
 if(!name)return null;
 name=name.replace(/^[（(]?\d+[）)]?[.、\s]+/,'').replace(/\s*\([^)]*\d{4,}[^)]*\)\s*$/,'').trim();
 const room=(clean.match(/(?:教室|地点)[：:]\s*([^\n]+)/)||[])[1]||(clean.match(/教\s*\d+[-－]\d+/)||[])[0]||'';
 const teacher=(clean.match(/(?:教师|老师)[：:]\s*([^\n]+)/)||[])[1]||'';
 let weeks=wm[0];if(/[单双]/.test(clean)&&!/[单双]/.test(weeks))weeks+=clean.includes('单')?'(单)':'(双)';
 return normalizeCourse({name,day,start:sm?Number(sm[1]):slot,end:sm?Number(sm[2]||sm[1]):slot,weeks,room,teacher,source:'教务课表HTML'},i);
}
export function fromTimetable(rows){
 const courses=[],warnings=[];let header=-1,dayColumns=[];
 for(let i=0;i<Math.min(rows.length,20);i++){const found=[];rows[i].forEach((v,x)=>{const m=String(v).trim().match(/^(?:星期|周)([一二三四五六日天])$/);if(m)found.push([x,weekday(m[1])]);});if(found.length>=5){header=i;dayColumns=found;break;}}
 if(header<0)return {courses:[],warnings:['未识别到周一至周日的网格表头。']};
 const seen=new Map();let inferredSlot=0;
 for(let y=header+1;y<rows.length;y++){
   const leading=rows[y].slice(0,dayColumns[0][0]).join(' ');const slotMatch=leading.match(/(?:第\s*)?(\d{1,2})(?:\s*[-—~至]\s*(\d{1,2}))?\s*节/ )||leading.trim().match(/^(\d{1,2})$/);
   let slot=slotMatch?Number(slotMatch[1]):++inferredSlot;if(slotMatch)inferredSlot=slot; if(slot<1||slot>14)continue;
   for(const [x,day]of dayColumns){const text=String(rows[y][x]??'').trim();if(!text||/^(无|空|休息|午休|晚休)$/.test(text))continue;const key=day+'|'+text;
     if(seen.has(key)){const c=seen.get(key);if(c.end===slot-1&&!/\d\s*节/.test(text))c.end=slot;continue;}
     try{const c=parseCell(text,day,slot,courses.length);if(c){if(slotMatch?.[2]&&!/\d\s*节/.test(text))c.end=Number(slotMatch[2]);seen.set(key,c);courses.push(c);}else warnings.push('周'+day+'第'+slot+'节未识别到周次，未导入：'+text.slice(0,35));}catch(e){warnings.push(e.message);}
   }
 }
 return {courses,warnings};
}
export function importText(text,kind='text'){
 if(text.length>8*1024*1024)throw Error('文件过大，请控制在8MB以内');
 const trimmed=text.replace(/^\uFEFF/,'').trim();
 if(trimmed.startsWith('{')||trimmed.startsWith('[')){
  const data=JSON.parse(trimmed),list=Array.isArray(data)?data:data.courses;if(!Array.isArray(list)||list.length>1000)throw Error('JSON应包含courses数组，最多1000条');
  const courses=[],warnings=[];list.forEach((r,i)=>{try{courses.push(normalizeCourse(r,i));}catch(e){warnings.push('第'+(i+1)+'条：'+e.message);}});
  return {courses,warnings,settings:!Array.isArray(data)&&data.settings?normalizeSettings(data.settings):undefined};
 }
 if(/<table[\s>]/i.test(trimmed)||kind==='html'){
  let best={courses:[],warnings:[]};for(const rows of extractTables(trimmed)){for(const parse of [fromRows,fromTimetable]){const result=parse(rows);if(result.courses.length>best.courses.length)best=result;}}return best.courses.length?best:{courses:[],warnings:['未能识别课表HTML；请导出课程明细CSV，或使用模板。']};
 }
 return fromRows(parseDelimited(trimmed));
}
export function escapeICS(s){return String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function foldLine(line){let out=[],part='',bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>74){out.push(part);part=' ';bytes=1;}part+=c;bytes+=n;}out.push(part);return out.join('\r\n');}
export function calendarExport(courses,settings){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Qingke//Timetable//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:轻课 · 南邮课表','X-WR-TIMEZONE:Asia/Shanghai'];
 const stamp=new Date().toISOString().replace(/[-:]|\.\d{3}/g,'');
 for(const c of courses)for(const week of c.weeks){const date=addDays(settings.startDate,(week-1)*7+c.day-1);const utc=time=>new Date(date+'T'+time+':00+08:00').toISOString().replace(/[-:]|\.\d{3}/g,'');lines.push('BEGIN:VEVENT',`UID:${escapeICS(c.id)}-${date}@qingke.local`,`DTSTAMP:${stamp}`,`DTSTART:${utc(settings.times[c.start-1][0])}`,`DTEND:${utc(settings.times[c.end-1][1])}`,`SUMMARY:${escapeICS(c.name)}`,`LOCATION:${escapeICS(c.room)}`,`DESCRIPTION:${escapeICS('第'+week+'周 / 第'+c.start+'—'+c.end+'节'+(c.teacher?' / '+c.teacher:'')+(c.needsReview?'；据截图录入，周次待核对':'')+(c.notes?'；'+c.notes:''))}`,'END:VEVENT');}
 lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
