const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const User = require('./User');
const Course = require('./Course');
const Image = require('./Image');
const Activity = require('./Activity');
const Room = new mongoose.Schema({
  activity: {type: ObjectId, ref: 'Activity'},
  name: {type: String, required: true},
  description: {type: String},
  instructions: {type: String},
  entryCode: {type: String},
  course: {type: ObjectId, ref: 'Course'},
  creator: {type: ObjectId, ref: 'User'},
  dueDate: {type: Date,},
  chat: {type: [{type: ObjectId, ref: 'Message'}], default: []},
  members: [{
    user: {type: ObjectId, ref: 'User'},
    role: {type: String},
    _id: false}],
  currentMembers: {type: [{user: {type: ObjectId, ref: 'User'}, socket: {type: String},  _id: false}], default: []},
  tabs: {type: [{type: ObjectId, ref: 'Tab'}]},
  privacySetting: {type: String, enum: ['private', 'public'], default: 'private'},
  tempRoom: {type: Boolean, default: false},
  image: {type: String,},
  graphImage: {type: ObjectId, ref: 'Image'},
  controlledBy: {type: ObjectId, ref: 'User', defaut: null}
},
{timestamps: true});

Room.pre('save', function (next) {
  if (this.isNew && !this.tempRoom) {
    let promises = [];
    promises.push(Image.create({imageData: ''}))
    // Add the room to all of the users in this room
    promises = promises.concat(this.members.map(member => {
      // add a new room notification if they're not the facilitator
      let query = {$addToSet: {rooms: this._id}}
      if (member.role === 'participant' && this.course) {
        query = {$addToSet: {
          rooms: this._id,
          'courseNotifications.access': {
            notificationType: 'assignedRoom', _id: this.course, room: this._id}
          }
        }
      }
      return User.findByIdAndUpdate(member.user, query)
    }))
    // promises.push(User.findByIdAndUpdate(this.creator, {$addToSet: {rooms: this._id}}))
    if (this.course) {
      promises.push(Course.findByIdAndUpdate(this.course, {$addToSet: {rooms: this._id},}))
    }
    if (this.activity) {
      promises.push(Activity.findByIdAndUpdate(this.activity, {$addToSet: {rooms: this._id}}))
    }
    Promise.all(promises)
    .then(values => {
      if (values[0]) {
        this.graphImage = values[0]._id;
      }
      next()
    })
    .catch(err => next(err)) //@TODO WE NEED ERROR HANDLING HERE
  } else if (!this.isNew) {
    this.modifiedPaths().forEach(field => {
      if (field === 'members') {
        User.findByIdAndUpdate(this.members[this.members.length - 1].user, {
          $addToSet: {rooms: this._id}
        }).then(user => {next()})
        .catch(err => console.log(err))
      } else if (field === 'tempRoom') {
        User.findByIdAndUpdate(this.creator, {$addToSet: {rooms: this._id}})
        .then(res => {
          next()
        })
        .catch(err => console.log(err))
      } else if (field === 'currentMembers') {
        console.log('current members modified what we can do with tha info...how do we tell WHO was added')
        console.log(this)
      }
    })
  } else {
    next()
  }
});

Room.pre('remove', async function() {
  const promises = []
  if (this.course) {
    promises.push(Course.findByIdAndUpdate(this.course, {$pull: {rooms: this._id}}))
  }
  promises.push(User.update({_id: {$in: this.members.map(member => member.user)}}, {
    $pull: {
      rooms: this._id,
      'roomNotifications.access': {_id: this._id},
      'roomNotications.newRoom': {_id: this._id}
    }
  }, {multi: true}))
  await Promise.all(promises)
})

Room.methods.summary = function() {
  // @TODO ONLY RETURN THE ENTRY CODE IF THE CLIENT IS THE OWNER
  obj = {
    entryCode: this.entryCode,
    activity: this.activity,
    name: this.name,
    description: this.description,
    privacySetting: this.privacySetting,
    roomType: this.roomType,
    course: this.course,
    creator: this.creator,
    dueDate: this.dueDate,
    members: this.members,
    tabs: this.tabs,
    events: this.events,
    chat: this.chat,
    image: this.image,
    _id: this._id,
  }
  return (obj)
  // next();
}
module.exports = mongoose.model('Room', Room);
