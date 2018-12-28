import React, { Component } from 'react';
import { Aux, Button } from '../../Components';
import Modal from '../UI/Modal/Modal'
import classes from './editableText.css';
import { connect } from 'react-redux';
import { updateRoomTab, updateRoom, updateActivity, updateCourse, updateActivityTab, } from '../../store/actions';
class EditableText extends Component {
  state = {
    text: this.props.children,
    editing: false,
    trashing: false,
  }

  // componentDidMount(){
  //   this.setState({
  //     text: this.props.children
  //   })
  // }
  componentDidUpdate(prevProps, prevState){
    if (prevState === this.state && prevProps.children !== this.props.children) {
      this.setState({text: this.props.children})
    }
  }

  onKeyPress = (event) => {
    if (event.key === 'Enter') {
      this.submit();
    }
  }

  updateText = (event) => {
    this.setState({text: event.target.value})
  }

  toggleEdit = () => {
    this.setState(prevState => ({
      editing: !prevState.editing
    }))
  }

  delete = () => {
    let {
      parentResource,
      parentId,
      id,
      room,
    } = this.props;
    if (parentResource === 'room') {
      let tabs = room.tabs.filter(tab => tab._id != id);
      let finalTabs = tabs.map(tab => tab._id);
      this.props.updateRoom(parentId, {tabs: finalTabs})
      this.props.updateRoomTab(parentId, id, {isTrashed: true})
    } else if (parentResource === 'activity') {
      this.props.updateActivityTab(parentId, id, {isTrashed: true})
    }
    this.setState({
      trashing: false,
      editing: false
    })
  }

  submit = () => {
    let {
      resource,
      parentResource,
      parentId ,
      field,
      id,
    } = this.props;
    console.log(parentResource)
    if (parentResource === 'room') {
      this.props.updateRoomTab(parentId, id, {[field]: this.state.text})
    } else if (parentResource === 'activity') {
      console.log("updatingActivtiy")
      this.props.updateActivityTab(parentId, id, {[field]: this.state.text})
    }
    this.toggleEdit();
  }

  render() {
    return (
      <div>
        <Aux>
        { this.state.editing
            ? <div className={this.props.inputType === 'TEXT_AREA' ? classes.EditContainer : classes.EditLine} >
              <b>{this.props.title}</b>
              {this.props.inputType === 'TEXT_AREA'
                ? <textarea className={classes.TextArea} onChange={this.updateText} value={this.state.text}/>
                : <input className={classes.TextInput} onChange={this.updateText} onKeyPress={this.onKeyPress} value={this.state.text}/>
              }
              <div className={classes.EditButtons}>
                <div><Button m={'0 10px'} click={this.submit}>Save</Button></div>
                <div><Button m={0} click={this.toggleEdit} theme='SmallCancel'>Cancel</Button></div>
                <div><Button m={0} click={() => this.setState({trashing: true})} theme="Delete"><i className={'fas fa-trash'}></i></Button></div>
              </div>
            </div>
            : <div>
                <b>{this.props.title}</b> {this.props.children}
                {this.props.owner ?  <i onClick={this.toggleEdit} className={["fas fa-edit", classes.ToggleEdit].join(' ')}></i> : null}
              </div>
          }
        </Aux>
        <Modal show={this.state.trashing} closeModal={() => this.setState({trashing: false})}>
          <div>
            <h1 className={classes.ModalHeading}>Are you sure you want to delete this tab?</h1>
            <p className={classes.ModalContent}>Deleting this tab will delete all of the work that was completed</p>
            <div className={classes.ModalButtons}>
              <Button m={5} theme={'Small'} click={this.delete} data-testid='confirm-trash'>Yes</Button>
              <Button m={5} theme={'Cancel'} click={() => this.setState({trashing: false})}>No</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }
}

export default connect(null, {updateRoomTab, updateRoom, updateActivity, updateCourse, updateActivityTab,})(EditableText);