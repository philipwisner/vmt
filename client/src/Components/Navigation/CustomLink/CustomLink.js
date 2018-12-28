import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './customLink.css';
const CustomLink = (props) => {
  return (
    <NavLink to={props.to} className={classes.Link} activeStyle={{color: '#2D91F2', fontWeight: 700}}>{props.children}</NavLink>
  )
}

export default CustomLink;