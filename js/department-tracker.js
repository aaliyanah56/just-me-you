import { supabase } from './auth.js';

const DEPARTMENTS = [
  {key:'halaqa_management',name:'Halaqa Manager Team'},
  {key:'finance',name:'Finance Team'},
  {key:'social_media',name:'Social Media Team'},
  {key:'events',name:'Event Team'}
];
const $ = id => document.getElementById(id);
const msg = (text,error=false) => { $('pageMessage').innerHTML = ''; const p=document.createElement('div');p.className='dt-message'+(error?' error':'');p.textContent=text;$('pageMessage').append(p); };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const deptName = key => DEPARTMENTS.find(d=>d.key===key)?.name || key;
let user, profile, memberships=[], goals=[], reports=[], isAdmin=false, allProfiles=[];

function fillDeptSelect(id, allowed=DEPARTMENTS){
  const el=$(id); el.innerHTML=allowed.map(d=>'<option value="'+d.key+'">'+d.name+'</option>').join('');
  el.disabled=!isAdmin && allowed.length===1;
}
function canHead(key){return isAdmin || memberships.some(m=>m.department_key===key && m.access_level==='head');}
function canAccess(key){return isAdmin || memberships.some(m=>m.department_key===key);}
function refreshGoalOptions(){
 const dep=$('reportDepartment').value;
 $('reportGoal').innerHTML='<option value="">General department update</option>'+goals.filter(g=>g.department_key===dep).map(g=>'<option value="'+g.id+'">'+escapeHtml(g.title)+'</option>').join('');
}
function renderGoals(){
 $('goalList').innerHTML=goals.length?goals.map(g=>`<article class="dt-card"><div class="dt-meta"><span class="dt-pill">${escapeHtml(g.status.replace('_',' '))}</span><span>${escapeHtml(deptName(g.department_key))}</span><span>Due: ${escapeHtml(g.due_date||'Not set')}</span></div><h3>${escapeHtml(g.title)}</h3><p>${escapeHtml(g.description||'No description added.')}</p><div class="dt-meta">${escapeHtml(g.target_metric||'Target not specified')}${g.target_value!==null&&g.target_value!==undefined?' · '+escapeHtml(g.target_value)+' '+escapeHtml(g.unit||''):''}</div>${canHead(g.department_key)?'<label class="dt-muted">Goal status: <select data-goal-status="'+g.id+'"><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="on_hold">On hold</option></select></label>':''}</article>`).join(''):'<div class="dt-card dt-muted">No goals have been added yet. Department heads can create the first goals above.</div>';
 document.querySelectorAll('[data-goal-status]').forEach(el=>{const g=goals.find(x=>x.id===el.dataset.goalStatus);el.value=g.status;el.addEventListener('change',async()=>{const {error}=await supabase.from('department_goals').update({status:el.value,updated_at:new Date().toISOString()}).eq('id',g.id);if(error){msg(error.message,true);el.value=g.status;}else{g.status=el.value;msg('Goal status updated.');}});});
 $('statGoals').textContent=goals.filter(g=>g.status!=='completed').length;
}
function renderReports(){
 $('reportList').innerHTML=reports.length?reports.map(r=>`<article class="dt-card"><div class="dt-meta"><span class="dt-pill">${escapeHtml(r.review_status)}</span><span>${escapeHtml(deptName(r.department_key))}</span><span>${escapeHtml(r.report_type)}</span><span>${new Date(r.created_at).toLocaleDateString()}</span></div><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.details)}</p>${r.progress_percent!==null?'<div class="dt-meta">Reported progress: '+r.progress_percent+'%</div><div class="dt-progress"><span style="width:'+r.progress_percent+'%"></span></div>':''}${r.evidence_url?'<a href="'+escapeHtml(r.evidence_url)+'" target="_blank" rel="noopener noreferrer">Open evidence ↗</a>':''}${isAdmin&&r.review_status==='submitted'?'<div style="margin-top:12px"><button class="dt-btn secondary" data-review="'+r.id+'">Mark reviewed</button></div>':''}</article>`).join(''):'<div class="dt-card dt-muted">No reports submitted yet.</div>';
 document.querySelectorAll('[data-review]').forEach(btn=>btn.addEventListener('click',async()=>{btn.disabled=true;const {error}=await supabase.from('department_reports').update({review_status:'reviewed',reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq('id',btn.dataset.review);if(error){msg(error.message,true);btn.disabled=false;}else{msg('Report marked as reviewed.');await loadData();}}));
 $('statReports').textContent=reports.length;$('statPending').textContent=reports.filter(r=>r.review_status==='submitted').length;
}
async function loadData(){
 let gq=supabase.from('department_goals').select('*').order('created_at',{ascending:false});
 let rq=supabase.from('department_reports').select('*').order('created_at',{ascending:false}).limit(100);
 const [g,r]=await Promise.all([gq,rq]);if(g.error)throw g.error;if(r.error)throw r.error;
 goals=g.data||[];reports=r.data||[];renderGoals();renderReports();
 $('statDepartments').textContent=isAdmin?4:memberships.length;
 refreshGoalOptions();
}
async function loadMemberships(){
 const {data,error}=await supabase.from('department_memberships').select('id,profile_id,department_key,access_level,created_at').order('created_at',{ascending:false});
 if(error)throw error;memberships=data||[];
}
async function setupAdminAccess(){
 $('access').classList.remove('dt-hidden');$('accessNav').classList.remove('dt-hidden');
 const {data,error}=await supabase.from('profiles').select('id,full_name,email,status').order('full_name');
 if(error)throw error;allProfiles=data||[];
 $('memberProfile').innerHTML=allProfiles.map(p=>'<option value="'+p.id+'">'+escapeHtml(p.full_name||p.email||p.id)+' · '+escapeHtml(p.status)+'</option>').join('');
 $('memberDepartment').innerHTML=DEPARTMENTS.map(d=>'<option value="'+d.key+'">'+d.name+'</option>').join('');
 renderMemberships();
}
function renderMemberships(){
 $('membershipList').innerHTML='<div style="overflow:auto;margin-top:15px"><table class="dt-table"><thead><tr><th>Member</th><th>Department</th><th>Access</th></tr></thead><tbody>'+memberships.map(m=>{const p=allProfiles.find(x=>x.id===m.profile_id);return '<tr><td>'+escapeHtml(p?.full_name||p?.email||m.profile_id)+'</td><td>'+escapeHtml(deptName(m.department_key))+'</td><td>'+escapeHtml(m.access_level)+'</td></tr>';}).join('')+'</tbody></table></div>';
}
async function init(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){location.replace('/portal/admin/login.html');return;}
 user=session.user;
 const {data:p,error:pe}=await supabase.from('profiles').select('id,full_name,email,role,status').eq('id',user.id).single();
 if(pe||!p||p.status!=='approved'){await supabase.auth.signOut();location.replace('/');return;}
 profile=p;document.querySelectorAll('[data-profile-name]').forEach(el=>el.textContent=p.full_name||'URWA member');
 isAdmin=p.role==='admin';
 await loadMemberships();
 const available=isAdmin?DEPARTMENTS:DEPARTMENTS.filter(d=>memberships.some(m=>m.department_key===d.key));
 if(!isAdmin&&!available.length){msg('Your account is signed in, but no department access has been assigned yet. Please contact URWA administration.',true);$('goalForm').classList.add('dt-hidden');$('reportForm').classList.add('dt-hidden');return;}
 fillDeptSelect('goalDepartment',available);fillDeptSelect('reportDepartment',available);
 $('createGoalPanel').classList.toggle('dt-hidden',!isAdmin&&!memberships.some(m=>m.access_level==='head'));
 await loadData();
 if(isAdmin)await setupAdminAccess();
 $('reportDepartment').addEventListener('change',refreshGoalOptions);
 $('goalForm').addEventListener('submit',saveGoal);
 $('reportForm').addEventListener('submit',saveReport);
 $('membershipForm').addEventListener('submit',saveMembership);
}
async function saveGoal(e){
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 const payload={department_key:$('goalDepartment').value,title:$('goalTitle').value.trim(),description:$('goalDescription').value.trim()||null,target_metric:$('goalMetric').value.trim()||null,target_value:$('goalValue').value?Number($('goalValue').value):null,unit:$('goalUnit').value.trim()||null,start_date:$('goalStart').value||null,due_date:$('goalDue').value||null,created_by:user.id};
 const {error}=await supabase.from('department_goals').insert(payload);
 if(error)msg(error.message,true);else{$('goalForm').reset();msg('Department goal saved.');await loadData();}btn.disabled=false;
}
async function saveReport(e){
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 const evidence=$('reportEvidence').value.trim();
 const payload={department_key:$('reportDepartment').value,goal_id:$('reportGoal').value||null,report_type:$('reportType').value,title:$('reportTitle').value.trim(),details:$('reportDetails').value.trim(),progress_percent:$('reportProgress').value===''?null:Number($('reportProgress').value),evidence_url:evidence||null,period_start:$('periodStart').value||null,period_end:$('periodEnd').value||null,submitted_by:user.id};
 const {error}=await supabase.from('department_reports').insert(payload);
 if(error)msg(error.message,true);else{$('reportForm').reset();msg('Your report has been submitted for administrative review.');await loadData();}btn.disabled=false;
}
async function saveMembership(e){
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 const payload={profile_id:$('memberProfile').value,department_key:$('memberDepartment').value,access_level:$('memberLevel').value,assigned_by:user.id};
 const {error}=await supabase.from('department_memberships').upsert(payload,{onConflict:'profile_id,department_key'});
 if(error)msg(error.message,true);else{msg('Department access assigned.');await loadMemberships();renderMemberships();}btn.disabled=false;
}
init().catch(err=>msg(err.message||'Could not load the department tracker.',true));
