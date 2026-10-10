import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        userId: { type: String, required: true, index: true },
        action: { type: String, required: true },
        entityType: { type: String, required: true, index: true },
        entityId: { type: String },
        metadata: { type: Schema.Types.Mixed },
        ip: { type: String },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: false },
        versionKey: false,
    }
);

activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
activityLogSchema.index({ userId: 1, entityType: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema, 'activity_logs');
