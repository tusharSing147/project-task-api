import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../libs/config/prismaClient';
const statuses = ['active', 'completed', 'archived'];
const uid = (req: Request) => Number(req.id);
function positiveId(raw: unknown): number | null { const n = Number(raw); return Number.isSafeInteger(n) && n > 0 ? n : null; }

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, status } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) {
      res.status(422).json({ success: false, message: 'name must be 2–150 characters', data: null }); return;
    }
    if (status !== undefined && !statuses.includes(status)) { res.status(422).json({ success: false, message: 'Invalid project status', data: statuses }); return; }
    const project = await prisma.project.create({ data: { name: name.trim(), description: description == null ? null : String(description), status: status ?? 'active', userId: uid(req) } });
    res.status(201).json({ success: true, message: 'Project created', data: project });
  } catch (e) { next(e); }
}
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const where: any = { userId: uid(req) };
    if (req.query.status) { if (!statuses.includes(String(req.query.status))) { res.status(422).json({ success: false, message: 'Invalid status', data: statuses }); return; } where.status = String(req.query.status); }
    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.project.count({ where })
    ]);
    res.json({ success: true, message: 'Projects retrieved', data: { items: projects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { next(e); }
}
export async function getById(req: Request, res: Response, next: NextFunction) {
  try { const id = positiveId(req.params.id); if (!id) { res.status(400).json({ success:false,message:'Invalid project ID',data:null }); return; }
    const project = await prisma.project.findFirst({ where: { id, userId: uid(req) } });
    if (!project) { res.status(404).json({ success:false,message:'Project not found',data:null }); return; }
    res.json({ success:true,message:'Project retrieved',data:project });
  } catch (e) { next(e); }
}
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = positiveId(req.params.id); if (!id) { res.status(400).json({ success:false,message:'Invalid project ID',data:null }); return; }
    const { name, description, status } = req.body ?? {}; const data: any = {};
    if (name !== undefined) { if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) { res.status(422).json({success:false,message:'name must be 2–150 characters',data:null}); return; } data.name = name.trim(); }
    if (description !== undefined) data.description = description === null ? null : String(description);
    if (status !== undefined) { if (!statuses.includes(status)) { res.status(422).json({success:false,message:'Invalid project status',data:statuses}); return; } data.status = status; }
    if (!Object.keys(data).length) { res.status(422).json({success:false,message:'No valid fields supplied',data:null}); return; }
    const exists = await prisma.project.findFirst({ where:{id,userId:uid(req)} }); if (!exists) { res.status(404).json({success:false,message:'Project not found',data:null}); return; }
    const project = await prisma.project.update({ where:{id}, data });
    res.json({success:true,message:'Project updated',data:project});
  } catch(e) { next(e); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { const id=positiveId(req.params.id); if(!id){res.status(400).json({success:false,message:'Invalid project ID',data:null});return;}
    const project=await prisma.project.findFirst({where:{id,userId:uid(req)}}); if(!project){res.status(404).json({success:false,message:'Project not found',data:null});return;}
    await prisma.project.delete({where:{id}}); res.json({success:true,message:'Project deleted',data:null});
  } catch(e){next(e);}
}
