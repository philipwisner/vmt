import React, { Component } from 'react';
// import { CustomLink } from 'react-router-dom';
import BoxList from '../BoxList/BoxList';
import { Search, CustomLink }from '../../Components/';
// import Button from '../../Components/UI/Button/Button';
import classes from './community.css';
class Community extends Component {

    render() {
      const { resource, visibleResources, linkPath, linkSuffix, selecting, selectCount, select } = this.props;
      let selectCountClass = (selectCount === 0) ? classes.SelectCountNone : classes.SelectCountPos;
      return (
        <div className={classes.Container}>
        <h3 className={classes.Title}>Search for activities or ask to join rooms and courses</h3>
        <div className={classes.ResourceOpts}>
          <div><CustomLink to="/community/activities">Activities</CustomLink></div>
          <div><CustomLink to="/community/courses">Courses</CustomLink></div>
          <div><CustomLink to="/community/rooms">Rooms</CustomLink></div>
        </div>
        <div className={classes.Search}><Search _filter={value => this.filterResults(value)} /></div>
        <div className={classes.List}>
          {selecting ? <div className={classes.Selecting} data-testid='select-tag'>Selecting</div> : null}
          {selecting ? <div className={[classes.SelectCount, selectCountClass].join(" ")}>You have selected <span data-testid='select-count'>{selectCount}</span> {selectCount > 1 || selectCount === 0 ? 'activities' : 'activity' }</div> : null}
          <BoxList
            list={visibleResources}
            resource={resource}
            linkPath={linkPath}
            linkSuffix={linkSuffix}
            listType='public'
            selecting={selecting}
            select={select}
          />
        </div>

      </div>
      )
    }
}

export default Community;