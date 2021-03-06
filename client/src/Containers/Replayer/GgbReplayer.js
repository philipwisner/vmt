import React, { Component } from 'react';
import classes from '../Workspace/graph.css';
import Aux from '../../Components/HOC/Auxil';
// import { GRAPH_HEIGHT } from '../../constants'
import Modal from '../../Components/UI/Modal/Modal';
import Script from 'react-load-script';
import { parseString } from 'xml2js';
class GgbReplayer extends Component {

  state = {
    loading: true,
    xmlContext: '',  // xml string representing everything but the events and commands
    tabStates: {},
  }

  graph = React.createRef()
  previousState = '';

  componentDidMount(){
    window.addEventListener("resize", this.updateDimensions);
    this.props.tabs.forEach(tab => {
      if (tab.startingPoint) {
        this.setState({
          tabStates: {
            ...this.state.tabStates,
            [tab._id]: {construction: tab.startingPoint}
          }
        })
      }
    })
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.index !== nextProps.index || this.state.loading !== nextState.loading) {
      return true;
    } 
    else if (this.props.currentTab !== nextProps.currentTab) {
      return true;
    }
    return false;
  }

  
  componentDidUpdate(prevProps, prevState) {
    let { log, index, changingIndex } = this.props;
    // If we've changed tab while playing
    if (prevProps.currentTab !== this.props.currentTab) {
      console.log('current tab changed')
      let { currentTab, tabs } = this.props;
      let tabStates = {...this.state.tabStates}
      // stash prev tabs state in cae we come back to it 
      tabStates[tabs[prevProps.currentTab]._id] = {...tabStates[tabs[prevProps.currentTab]._id], construction: this.ggbApplet.getXML()}
      this.setState({tabStates,})
      // Load up the previously saved state if it exsists 
      if (Object.keys(tabStates).filter(tabId => tabId === tabs[currentTab]._id).length > 0) {
        this.ggbApplet.setXML(this.state.tabStates[tabs[currentTab]._id].construction)
      }
      else {
        this.ggbApplet.reset()
      }
    }
    
    if (changingIndex && this.state.tabStates !== prevState.tabStates) {

    }
    
    // IF we're skipping it means we might need to reconstruct several evenets, possible in reverse order if the prevIndex is greater than this index.
    // This is a god damned mess...good luck 
    else if (changingIndex) {
      console.log('changing Index...i.e. skipping')
      // If our target tab is different from the one we're on
      if (this.props.log[this.props.index].tab !== this.props.tabs[this.props.currentTab]._id) {
        // Save the currentState and index of the current Tab
        let tabStates = {...this.state.tabStates}
        // stash prev tabs state so we can come back to it
        tabStates[this.props.tabs[prevProps.currentTab]._id] = {construction: this.ggbApplet.getXML(), lastIndex: prevProps.index}
        this.setState({tabStates,})
        // See if the target tab is stored In tabStates
        let startIndex;
        if (tabStates[log[this.props.index].tab]) {
          startIndex = tabStates[log[this.props.index].tab].lastIndex;
        } 
        else {startIndex = prevProps.index}
        let tabIndex;
        // find the target tab index
        this.props.tabs.forEach((tab, i) => {
          if (tab._id === this.props.log[this.props.index].tab){
            tabIndex = i
          }
        })
        // We've promisified changeTab() so we can ensure we wait for the state to be updated before proceeding
        this.props.changeTab(tabIndex)
        .then(() => {
          this.applyMultipleEvents(startIndex, this.props.index)
        })
        .catch(err => console.log('React Broke'))
      }
      else {
        this.applyMultipleEvents(prevProps.index, this.props.index)
      }
    }
    else if (prevProps.log[prevProps.index]._id !== log[index]._id && !this.state.loading && !log[index].text && !log[index].synthetic) {
      console.log('we switched to a new eventindex while playing')
      // check if the tab has changed
      this.constructEvent(log[index])
    }
    // else if (!this.state.loading || this.state.tabStates !== prevState.tabStates){
    //   console.log('the tabState have changed')
    //   this.constructEvent(log[index])
    // }
  }

  componentWillUnmount(){
    window.removeEventListener("resize", this.updateDimensions);
  }

  applyMultipleEvents(startIndex, endIndex) {
    this.ggbApplet.setRepaintingActive(false) // THIS DOES NOT SEEM TO BE WORKING
    // Forwards through time
    if (startIndex < endIndex) {
      for (let i = startIndex; i <= endIndex; i++) {
        this.constructEvent(this.props.log[i])
      }
    } 
    // backwards through time
    else {
      for (let i = startIndex; i > endIndex; i--) {
        let syntheticEvent = {...this.props.log[i]}
        if (syntheticEvent.eventType === 'ADD') {
          syntheticEvent.eventType = 'REMOVE'
        } 
        else if (syntheticEvent.eventType === 'REMOVE') {
          syntheticEvent.eventType = 'ADD'
        }
        this.constructEvent(syntheticEvent)
      }
    }
        // for (let i = prevProps.index; i >= index + 1; i--) {
        //   let syntheticEvent = {...log[i]}
        //   if (syntheticEvent.eventType === 'ADD') {
        //     syntheticEvent.eventType = 'REMOVE'
        //   } 
        //   else if (syntheticEvent.eventType === 'REMOVE') {
        //     syntheticEvent.eventType = 'ADD'
        //   }
        //   this.constructEvent(syntheticEvent)
        // }
      
      this.ggbApplet.setRepaintingActive(true)
  }
  
  constructEvent(event) {
    if (event.tab === this.props.tabs[this.props.currentTab]._id) {
      switch (event.eventType) {
        case 'ADD':
        if (event.definition && event.definition !== '') {
          this.ggbApplet.evalCommand(`${event.label}:${event.definition}`)
        }
        this.ggbApplet.evalXML(event.event)
        this.ggbApplet.evalCommand('UpdateConstruction()')
        break;
        case 'REMOVE':
        this.ggbApplet.deleteObject(event.label)
        break;
        case 'UPDATE':
        this.ggbApplet.evalXML(event.event)
        this.ggbApplet.evalCommand('UpdateConstruction()')
        break;
        default: break;
      }
    }
  }

  constructConsolidatedEvents(xml) {

  }

  
  onScriptLoad = () => {
    const parameters = {
      "id":"ggbApplet",
      // "width": 1300 * .75, // 75% width of container
      // "height": GRAPH_HEIGHT,
      "scaleContainerClasse": "graph",
      "showToolBar": false,
      "showMenuBar": false,
      "showAlgebraInput": true,
      "language": "en",
      "useBrowserForJS":false,
      "borderColor": "#ddd",
      "preventFocus":true,
      "appletOnLoad": this.initializeGgb,
      "appName":"whiteboard"
    };
    const ggbApp = new window.GGBApplet(parameters, '5.0');
    ggbApp.inject('ggb-element')
  }

  initializeGgb = () => {
    this.ggbApplet = window.ggbApplet;
    this.ggbApplet.setMode(40)
    this.ggbApplet.setXML(this.props.tabs[0].startingPoint)
    // let xmlContext = this.ggbApplet.getXML()
    // xmlContext = xmlContext.slice(0, xmlContext.length - 27) // THIS IS HACKY BUT ????
    // console.log(xmlContext)
    this.setState({
      // xmlContext, 
      loading: false,
    })
  }

  // This method is for when we're skipping forward or backward and, rather than apply each event 
  // one at a time to the construction, we instead consolidate all of the evemts into one event 
  // and apply it once /// IT DOESNT QUITE WORK BECAUSE SOMETIMES WE NEED TO EVALUATE COMMANDS RATHER THAN JUST ADD XML....BUT THERE MIGHT BE A SOLUTION HERE
  consolidateEvents(startingIndex, endingIndex) {
    // consolidate the log up until the startingIndex
    let syntheticLog = this.props.log.reduce((acc, event, idx) => {
      if (event.label && idx <= endingIndex) {
        if (acc[event.label] && event.eventType === 'REMOVE') {
          delete acc[event]
        } else {
          acc[event.label] = event.event
        }
      }
      return acc;
    }, {})
    let xmlString = Object.keys(syntheticLog).map(event => syntheticLog[event]).join('')
    this.ggbApplet.setRepaintingActive(false)
    for (let i = 0; i < endingIndex; i++){
      this.constructEvent(this.props.log[i])
    }
    this.ggbApplet.setRepaintingActive(true)
    // this.ggbApplet.setXML(this.state.xmlContext + xmlString + '</construction></geogebra>')



    // console.log(syntheticLog)
    // this.parseXML(this.ggbApplet.getXML())
    // .then(parsedXML => {
    //   console.log(parsedXML)
    //   let existingEvents = {}
    //   console.log(this.props.log)
    //   parsedXML.geogebra.construction[0].element.forEach(event => {
    //   })
    //   console.log(existingEvents)
    // })
    // rpelay forwards
    // let { log } = this.props;
    // let syntheticLog = {};
    // if (startingIndex < endingIndex) {
    //   for (let i = startingIndex + 1; i <= endingIndex; i++) {
    //     // If no label then its not a ggb event
    //     if (log[i].label) {
    //       // If we're removing an event we had previosuly added in this string of events then get rid of it 
    //       if (log[i].eventType === 'REMOVE' && syntheticLog[log[i].label]) {
    //         delete syntheticLog[log[i].label]
    //       }
    //       // Else we are removing a point that had been added before the skipFromPoint
    //       // Because we're going to update the construction all at once
    //       else {

    //       }
    //       syntheticLog[log[i].label] = log[i]
    //     }
    //   }
    //   console.log(syntheticLog)
    //   let syntheticLogArr = Object.keys(syntheticLog).map(key => {
    //     console.log(key)
    //     return syntheticLog[key]
    //   }).join('')
    //   console.log(syntheticLogArr)
    // }
    // else {

    // }
  }

  // This is repeated in ggbGraph...I wonder if we should have a separate file of shared functions
  parseXML = (xml) => {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) return reject(err)
        return resolve(result)
      })
    })
  }

  updateDimensions = () => {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer)
    }
    this.resizeTimer = setTimeout(() => {
      if (this.graph.current && !this.state.loading) {
        let { clientHeight, clientWidth } = this.graph.current.parentElement;
        window.ggbApplet.setSize(clientWidth, clientHeight);
        // window.ggbApplet.evalCommand('UpdateConstruction()')
      }
      this.resizeTimer = undefined;
    }, 200)
  }
  
  render() {

    return (
      <Aux>
        <Script url='https://cdn.geogebra.org/apps/deployggb.js' onLoad={this.onScriptLoad} />
        <div className={classes.Graph} id='ggb-element' ref={this.graph}></div>
        <Modal show={this.state.loading} message='Loading...'/>
      </Aux>
    )
  }
}

export default GgbReplayer;
