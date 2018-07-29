import React, { Component } from 'react';
import Navbar from '../Components/Navigation/Navbar';
import Login from '../Containers/Login/Login';
import Room from '../Containers/Room/Room';
import Course from '../Containers/Course/Course';
import PublicList from '../Containers/PublicList/PublicList';
import NewUser from '../Containers/Create/NewUser/NewUser';
import Dashboard from '../Containers/Dashboard/Dashboard';
import Assignments from '../Containers/Assignments/Assignments';
import Avatar from '../Components/UI/Avatar/Avatar';
import PrivateRoute from '../Components/HOC/PrivateRoute';
import classes from './main.css';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Route, Switch} from 'react-router-dom';

class Main extends Component {
  render() {
    return (
      <Router>
        <main className={classes.Main}>
          {/* <div className={classes.Particles} id='particles-js'></div> */}
          <div className={classes.Banner}>
            <h2>Virtual Math Teams</h2>
            {this.props.loggedIn ? <Avatar username={this.props.username} /> : null}
          </div>
          <Navbar />
          <section className={classes.Section}>
            {/* @TODO This Whole structure needs to be retought... we need to utilize sub routes further down the component tree */}
            <Switch>
              <Route exact path='/' component={Login}/>
              <Route path='/users/new' authed={this.props.loggedIn} component={NewUser}/>
              <PrivateRoute exact path='/dashboard' authed={this.props.loggedIn} component={Dashboard}/>
              <PrivateRoute exact path = '/dashboard/course/:course_id' authed={this.props.loggedIn} component={Course}/>
              <Route exact path='/courses' render={props => <PublicList {...props} resource='course' />}/>
              <Route exact path='/rooms' render={props => <PublicList {...props} resource='room' />}/>
              <PrivateRoute exact path='/room/:room_id' authed={this.props.loggedIn} component={Room}/>
              <PrivateRoute exact path='/dashboard/course/:course_id/room/:room_id' authed={this.props.loggedIn} component={Room}/>
              <PrivateRoute exact path='/course/:course_id' authed={this.props.loggedIn} component={Course} />
              <PrivateRoute path='/assign' authed={this.props.loggedIn} component={Assignments}/>
              <Route exact path='/logout' component={Login}/>
              <Route path="*" render={() => {
                return (<div>Error</div>)
              }}/>
            </Switch>
          </section>
        </main>
      </Router>
    )
  }
};

// Provide login status to all private routes
const mapStateToProps = store => {
  return {
    username: store.userReducer.username,
    loggedIn: store.userReducer.loggedIn,
  };
}

export default connect(mapStateToProps, null)(Main);
