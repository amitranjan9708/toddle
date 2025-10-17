# Notification System Architecture

## Overview

The Virtual Classroom API includes a comprehensive notification system designed to keep students and tutors informed about assignment deadlines, submissions, and other important events.

## Current Implementation

### Basic Notification Service

The current system uses `node-cron` to run scheduled tasks that check for upcoming deadlines:

```javascript
// src/services/notificationService.js
const cron = require('node-cron');

class NotificationService {
    static start() {
        // Run every minute to check for assignments close to deadline
        cron.schedule('* * * * *', async () => {
            const now = new Date();
            const assignments = await Assignment.findAll();
            assignments.forEach(a => {
                if(a.deadline && (a.deadline - now) / 1000 < 3600) {
                    console.log(`Reminder: Assignment ${a.id} is due soon!`);
                }
            });
        });
    }
}
```

## Enhanced Notification System Architecture

### 1. System Components

#### A. Notification Engine
- **Purpose**: Core notification processing and delivery
- **Technology**: Node.js with Bull Queue for job processing
- **Features**:
  - Scheduled notifications
  - Real-time notifications
  - Retry mechanisms
  - Delivery tracking

#### B. Notification Channels
- **Email**: SMTP-based email delivery
- **SMS**: Twilio or similar SMS service
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **In-App**: WebSocket-based real-time notifications
- **Slack/Discord**: Integration with team communication tools

#### C. Notification Templates
- **Assignment Reminders**: "Assignment due in 24 hours"
- **Submission Notifications**: "New submission received"
- **Grade Notifications**: "Assignment graded"
- **System Notifications**: "System maintenance scheduled"

### 2. Database Schema

```sql
-- Notification Templates
CREATE TABLE NotificationTemplates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'in_app'
    subject VARCHAR(200),
    body TEXT NOT NULL,
    variables JSON, -- Template variables
    isActive BOOLEAN DEFAULT true,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification Queue
CREATE TABLE Notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    templateId INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(200),
    body TEXT NOT NULL,
    data JSON, -- Additional data
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'retrying'
    scheduledAt DATETIME,
    sentAt DATETIME,
    attempts INTEGER DEFAULT 0,
    maxAttempts INTEGER DEFAULT 3,
    errorMessage TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (templateId) REFERENCES NotificationTemplates(id)
);

-- User Notification Preferences
CREATE TABLE UserNotificationPreferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    emailEnabled BOOLEAN DEFAULT true,
    smsEnabled BOOLEAN DEFAULT false,
    pushEnabled BOOLEAN DEFAULT true,
    inAppEnabled BOOLEAN DEFAULT true,
    assignmentReminders BOOLEAN DEFAULT true,
    submissionNotifications BOOLEAN DEFAULT true,
    gradeNotifications BOOLEAN DEFAULT true,
    reminderHours INTEGER DEFAULT 24,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);
```

### 3. Enhanced Service Implementation

```javascript
// src/services/notificationService.js
const Bull = require('bull');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');

class NotificationService {
    constructor() {
        this.emailQueue = new Bull('email notifications');
        this.smsQueue = new Bull('sms notifications');
        this.pushQueue = new Bull('push notifications');
        this.setupProcessors();
    }

    // Schedule notification
    async scheduleNotification(userId, templateId, data, scheduledAt) {
        const notification = await Notification.create({
            userId,
            templateId,
            data,
            scheduledAt,
            status: 'pending'
        });

        // Add to appropriate queue
        if (scheduledAt <= new Date()) {
            await this.sendImmediateNotification(notification);
        } else {
            await this.scheduleDelayedNotification(notification);
        }
    }

    // Send immediate notification
    async sendImmediateNotification(notification) {
        const user = await User.findByPk(notification.userId);
        const template = await NotificationTemplate.findByPk(notification.templateId);
        const preferences = await UserNotificationPreferences.findOne({
            where: { userId: notification.userId }
        });

        const promises = [];

        if (preferences.emailEnabled && template.type === 'email') {
            promises.push(this.sendEmail(user, template, notification.data));
        }

        if (preferences.smsEnabled && template.type === 'sms') {
            promises.push(this.sendSMS(user, template, notification.data));
        }

        if (preferences.pushEnabled && template.type === 'push') {
            promises.push(this.sendPushNotification(user, template, notification.data));
        }

        await Promise.allSettled(promises);
    }

    // Email notification
    async sendEmail(user, template, data) {
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const subject = this.renderTemplate(template.subject, data);
        const body = this.renderTemplate(template.body, data);

        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject,
            html: body
        });
    }

    // SMS notification
    async sendSMS(user, template, data) {
        const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        
        const message = this.renderTemplate(template.body, data);
        
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: user.phone
        });
    }

    // Push notification
    async sendPushNotification(user, template, data) {
        const message = {
            notification: {
                title: this.renderTemplate(template.subject, data),
                body: this.renderTemplate(template.body, data)
            },
            data: {
                type: template.type,
                assignmentId: data.assignmentId?.toString()
            },
            token: user.fcmToken
        };

        await admin.messaging().send(message);
    }

    // Template rendering
    renderTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    }
}
```

### 4. Notification Triggers

#### A. Assignment-Based Notifications
```javascript
// In AssignmentService
static async createAssignment(tutorId, description, studentIds, publishedAt, deadline) {
    const assignment = await Assignment.create({...});
    
    // Schedule notifications for students
    for (const studentId of studentIds) {
        // Assignment created notification
        await NotificationService.scheduleNotification(
            studentId,
            'assignment_created',
            { assignmentId: assignment.id, description },
            new Date()
        );

        // Reminder notifications
        if (deadline) {
            const reminderTimes = [24, 2, 1]; // hours before deadline
            reminderTimes.forEach(hours => {
                const reminderTime = new Date(deadline.getTime() - (hours * 60 * 60 * 1000));
                if (reminderTime > new Date()) {
                    await NotificationService.scheduleNotification(
                        studentId,
                        'assignment_reminder',
                        { assignmentId: assignment.id, hours },
                        reminderTime
                    );
                }
            });
        }
    }
}
```

#### B. Submission-Based Notifications
```javascript
// In AssignmentService
static async addSubmission(studentId, assignmentId, remark) {
    const submission = await Submission.create({...});
    
    // Notify tutor about new submission
    const assignment = await Assignment.findByPk(assignmentId);
    await NotificationService.scheduleNotification(
        assignment.tutorId,
        'submission_received',
        { assignmentId, studentId, remark },
        new Date()
    );

    // Confirm submission to student
    await NotificationService.scheduleNotification(
        studentId,
        'submission_confirmed',
        { assignmentId },
        new Date()
    );
}
```

### 5. Real-Time Notifications

#### WebSocket Implementation
```javascript
// src/services/websocketService.js
const WebSocket = require('ws');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map();
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const token = this.extractToken(req);
            const user = this.verifyToken(token);
            
            if (user) {
                this.clients.set(user.id, ws);
                ws.userId = user.id;
                
                ws.on('close', () => {
                    this.clients.delete(user.id);
                });
            } else {
                ws.close();
            }
        });
    }

    sendToUser(userId, notification) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    }

    broadcastToRole(role, notification) {
        this.clients.forEach((client, userId) => {
            if (client.userRole === role) {
                this.sendToUser(userId, notification);
            }
        });
    }
}
```

### 6. Configuration

```javascript
// src/config/notificationConfig.js
module.exports = {
    // Email configuration
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        from: process.env.FROM_EMAIL
    },

    // SMS configuration
    sms: {
        twilio: {
            accountSid: process.env.TWILIO_SID,
            authToken: process.env.TWILIO_TOKEN,
            from: process.env.TWILIO_PHONE
        }
    },

    // Push notification configuration
    push: {
        firebase: {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }
    },

    // Queue configuration
    queues: {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        }
    }
};
```

### 7. Monitoring and Analytics

```javascript
// src/services/notificationAnalytics.js
class NotificationAnalytics {
    static async getDeliveryStats(timeRange = '7d') {
        const stats = await Notification.findAll({
            where: {
                createdAt: {
                    [Op.gte]: new Date(Date.now() - this.parseTimeRange(timeRange))
                }
            },
            attributes: [
                'type',
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['type', 'status']
        });

        return stats;
    }

    static async getUserEngagement(userId) {
        const notifications = await Notification.findAll({
            where: { userId },
            include: ['template']
        });

        return {
            total: notifications.length,
            sent: notifications.filter(n => n.status === 'sent').length,
            failed: notifications.filter(n => n.status === 'failed').length,
            byType: this.groupBy(notifications, 'type')
        };
    }
}
```

## Implementation Phases

### Phase 1: Basic Email Notifications
- Set up SMTP configuration
- Create email templates
- Implement basic email sending
- Add assignment reminder emails

### Phase 2: Enhanced Scheduling
- Implement Bull Queue for job processing
- Add retry mechanisms
- Create notification preferences
- Add delivery tracking

### Phase 3: Multi-Channel Support
- Add SMS notifications (Twilio)
- Add push notifications (FCM)
- Implement WebSocket for real-time notifications
- Add notification preferences UI

### Phase 4: Advanced Features
- Add notification analytics
- Implement A/B testing for templates
- Add notification batching
- Create notification dashboard

## Benefits

1. **Improved Engagement**: Students stay informed about deadlines
2. **Better Communication**: Tutors get notified about submissions
3. **Reduced Missed Deadlines**: Proactive reminders
4. **Enhanced User Experience**: Multiple notification channels
5. **Scalability**: Queue-based processing handles high volume
6. **Reliability**: Retry mechanisms and error handling
7. **Analytics**: Track notification effectiveness

## Technologies Used

- **Node.js**: Runtime environment
- **Bull Queue**: Job processing and scheduling
- **Nodemailer**: Email delivery
- **Twilio**: SMS delivery
- **Firebase Cloud Messaging**: Push notifications
- **WebSocket**: Real-time notifications
- **Redis**: Queue storage and caching
- **Sequelize**: Database operations

This notification system provides a robust, scalable solution for keeping users informed and engaged in the virtual classroom environment.
