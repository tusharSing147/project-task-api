import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../../libs/config/schema';
import { prisma } from '../../libs/config/prismaClient';
const statuses = ['todo','in_progress','completed'];
const priorities = ['low','medium','high'];
const uid = (req: Request) => Number(req.id);
const validId = (id: unknown) => typeof id === 'string' && mongoose.isValidObjectId(id);

export async function create(req: Request,res: Response,next: NextFunction) {
 try {
  const {title,description,status,priority,dueDate,projectId}=req.body??{};
  if(typeof title!=='string'||title.trim().length<1||title.trim().length>200){res.status(422).json({success:false,message:'title is required (1–200 characters)',data:null});return;}
  if(status!==undefined&&!statuses.includes(status)){res.status(422).json({success:false,message:'Invalid status',data:statuses});return;}
  if(priority!==undefined&&!priorities.includes(priority)){res.status(422).json({success:false,message:'Invalid priority',data:priorities});return;}
  const pid=Number(projectId); if(!Number.isSafeInteger(pid)||pid<1){res.status(422).json({success:false,message:'Valid projectId is required',data:null});return;}
  const project=await prisma.project.findFirst({where:{id:pid,userId:uid(req)}});
  if(!project){res.status(404).json({success:false,message:'Project not found or not owned by user',data:null});return;}
  const task=await Task.create({title:title.trim(),description:description==null?'':String(description),status:status??'todo',priority:priority??'medium',dueDate:dueDate?new Date(dueDate):null,projectId:pid,userId:uid(req)});
  res.status(201).json({success:true,message:'Task created',data:task});
 }catch(e){next(e);}
}
export async function list(req: Request,res: Response,next: NextFunction) {
 try {
  const page=Math.max(1,Number(req.query.page)||1),limit=Math.min(100,Math.max(1,Number(req.query.limit)||10));
  const filter:any={userId:uid(req)};
  if(req.query.status){if(!statuses.includes(String(req.query.status))){res.status(422).json({success:false,message:'Invalid status',data:statuses});return;}filter.status=String(req.query.status);}
  if(req.query.priority){if(!priorities.includes(String(req.query.priority))){res.status(422).json({success:false,message:'Invalid priority',data:priorities});return;}filter.priority=String(req.query.priority);}
  if(req.query.projectId){const pid=Number(req.query.projectId);if(!Number.isSafeInteger(pid)||pid<1){res.status(422).json({success:false,message:'Invalid projectId',data:null});return;}filter.projectId=pid;}
  const [items,total]=await Promise.all([Task.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Task.countDocuments(filter)]);
  res.json({success:true,message:'Tasks retrieved',data:{items,pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}}});
 }catch(e){next(e);}
}
export async function getById(req: Request,res: Response,next: NextFunction) {
 try {if(!validId(req.params.id)){res.status(400).json({success:false,message:'Invalid task ID',data:null});return;}
  const task=await Task.findOne({_id:req.params.id,userId:uid(req)}).lean();if(!task){res.status(404).json({success:false,message:'Task not found',data:null});return;}
  res.json({success:true,message:'Task retrieved',data:task});
 }catch(e){next(e);}
}
export async function update(req: Request,res: Response,next: NextFunction) {
 try {if(!validId(req.params.id)){res.status(400).json({success:false,message:'Invalid task ID',data:null});return;}
  const {title,description,status,priority,dueDate,projectId}=req.body??{};const data:any={};
  if(title!==undefined){if(typeof title!=='string'||title.trim().length<1||title.trim().length>200){res.status(422).json({success:false,message:'Invalid title',data:null});return;}data.title=title.trim();}
  if(description!==undefined)data.description=String(description);
  if(status!==undefined){if(!statuses.includes(status)){res.status(422).json({success:false,message:'Invalid status',data:statuses});return;}data.status=status;}
  if(priority!==undefined){if(!priorities.includes(priority)){res.status(422).json({success:false,message:'Invalid priority',data:priorities});return;}data.priority=priority;}
  if(dueDate!==undefined){const date=dueDate===null?null:new Date(dueDate);if(date&&Number.isNaN(date.getTime())){res.status(422).json({success:false,message:'Invalid dueDate',data:null});return;}data.dueDate=date;}
  if(projectId!==undefined){const pid=Number(projectId);if(!Number.isSafeInteger(pid)||pid<1){res.status(422).json({success:false,message:'Invalid projectId',data:null});return;}const project=await prisma.project.findFirst({where:{id:pid,userId:uid(req)}});if(!project){res.status(404).json({success:false,message:'Project not found or not owned by user',data:null});return;}data.projectId=pid;}
  if(!Object.keys(data).length){res.status(422).json({success:false,message:'No valid fields supplied',data:null});return;}
  const task=await Task.findOneAndUpdate({_id:req.params.id,userId:uid(req)},{$set:data},{new:true,runValidators:true});
  if(!task){res.status(404).json({success:false,message:'Task not found',data:null});return;}
  res.json({success:true,message:'Task updated',data:task});
 }catch(e){next(e);}
}
export async function remove(req: Request,res: Response,next: NextFunction) {
 try {if(!validId(req.params.id)){res.status(400).json({success:false,message:'Invalid task ID',data:null});return;}
  const task=await Task.findOneAndDelete({_id:req.params.id,userId:uid(req)});if(!task){res.status(404).json({success:false,message:'Task not found',data:null});return;}
  res.json({success:true,message:'Task deleted',data:null});
 }catch(e){next(e);}
}
