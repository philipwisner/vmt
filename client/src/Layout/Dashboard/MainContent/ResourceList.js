import React from 'react';
import BoxList from '../../BoxList/BoxList';
import NewResource from '../../../Containers/Create/NewResource/NewResource';
import classes from './resourceList.css';
import Search from '../../../Components/Search/Search';
// CONSIDER RENAMING TO DASHBOARDCONTENT
const resources = props => {
    let linkPath =`/myVMT/${props.resource}/`;
    let linkSuffix;
    if (props.resource === 'courses') {
      linkSuffix = '/activities'
    } else {linkSuffix = '/details'}
    const displayResource = props.resource[0].toUpperCase() + props.resource.slice(1);
    if (props.parentResource === 'courses') {
      linkPath = `/myVMT/${props.parentResource}/${props.parentResourceId}/${props.resource}/`
      linkSuffix = '/details'
    }
    return (
      <div>
        {/* @TODO don't show create optinos for participants */}
        <div className={classes.Controls}>
          <div className={classes.Search}><Search /></div>
          <div className={classes.Tabs}>
            {props.parentResource !== 'activities' && props.user.accountType === 'facilitator'
              ? <NewResource
                  resource={props.resource}
                  courseId={props.parentResource === 'courses'
                    ? props.parentResourceId
                    : null
                  }
                />
              : null
            }
          </div>
        </div>
        <h2 className={classes.ResourceHeader}>My {displayResource}</h2>
        <BoxList
          list={props.userResources}
          linkPath={linkPath}
          linkSuffix={linkSuffix}
          notifications = {props.notifications}
          resource = {props.resource}
          listType = 'private'
          parentResourec={props.parentResource}
          // draggable
        />
      </div>
    )
  }

export default resources;
