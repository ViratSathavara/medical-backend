import { Request, Response, NextFunction } from 'express';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export class CommunicationController {
  /**
   * Get conversations or message thread with another user
   */
  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?.userId;
      const otherUserId = req.query.userId as string;

      if (otherUserId) {
        // Get thread with specific user
        const messages = await Message.find({
          $or: [
            { sender: currentUserId, recipient: otherUserId },
            { sender: otherUserId, recipient: currentUserId }
          ]
        })
          .populate('sender', 'email role profilePicture')
          .populate('recipient', 'email role profilePicture')
          .sort({ createdAt: 1 });

        // Mark unread messages as read
        await Message.updateMany(
          { sender: otherUserId, recipient: currentUserId, isRead: false },
          { isRead: true, readAt: new Date() }
        );

        sendSuccess(res, 'Messages thread loaded', messages);
      } else {
        // Get all recent messages involving current user
        const messages = await Message.find({
          $or: [{ sender: currentUserId }, { recipient: currentUserId }]
        })
          .populate('sender', 'email role profilePicture')
          .populate('recipient', 'email role profilePicture')
          .sort({ createdAt: -1 });

        sendSuccess(res, 'Recent messages loaded', messages);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user?.userId;
      const { recipientId, subject, content, attachments } = req.body;

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        sendError(res, 'Recipient not found', 404);
        return;
      }

      const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        subject: subject || '',
        content,
        attachments: attachments || [],
        isRead: false
      });

      // Also create a notification for the recipient
      await Notification.create({
        recipient: recipientId,
        title: 'New Secure Message',
        message: `You received a message: "${content.slice(0, 50)}..."`,
        type: 'SYSTEM',
        link: `/dashboard/${recipient.role.toLowerCase()}/messages`
      });

      sendSuccess(res, 'Message sent successfully', message, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications for authenticated user
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recipientId = req.user?.userId;
      const notifications = await Notification.find({ recipient: recipientId })
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = await Notification.countDocuments({ recipient: recipientId, read: false });

      sendSuccess(res, 'Notifications loaded', {
        notifications,
        unreadCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (id === 'all') {
        await Notification.updateMany({ recipient: req.user?.userId, read: false }, { read: true });
        sendSuccess(res, 'All notifications marked as read');
        return;
      }

      const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
      sendSuccess(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }
}
