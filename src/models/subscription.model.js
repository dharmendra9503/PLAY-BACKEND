import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber: {  // user who is subscribing to a channel
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    channel: {  //one to whom 'subscriber' is subscribing
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);