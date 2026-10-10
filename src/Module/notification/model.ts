import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

export interface INotification extends Document {
    _id: mongoose.Types.ObjectId;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    entityType?: string;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'],
            default: 'INFO',
        },
        read: { type: Boolean, default: false, index: true },
        entityType: { type: String },
        entityId: { type: String },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema, 'notifications');
