import React from 'react';
import './index.less';

import $ from 'jquery';

import AnimController from './component/AnimController';
import TextController from './component/TextController';
import OverLay from './component/OverLay';
import Mask from './component/Mask';
import NavController from './component/NavController';

import assign from 'object-assign';
import Animate from 'rc-animate';

import Common from './component/Common';


const motionTool = (config) => (ComposedComponent) =>
  class Wrapper extends Common {
    constructor() {
      super(...arguments);
      const _config = this.getURLConfig(config);
      this.state = {
        showMask: false,
        config: _config,
        maskChild: null,
        currentId: '',
        overlay: {
          left: 0,
          top: 0,
          width: $(document).width(),
          height: 0,
          text: '',
        },
        childId: '',
        showMode: !this.getURLData('mode'),
      };
      ['getToolChild',
        'docMouseOver',
        'convertConfig',
        'handleClick',
        'handleEnter',
        'getMaskChild',
        'toUrl',
      ].forEach((method) => this[method] = this[method].bind(this));
    }

    componentDidMount() {
      // 滑出root后,虚线删除
      window.addEventListener('hashchange', this.toUrl);
      this.componentDidUpdate();
    }

    componentDidUpdate() {
      // bind hover event
      // http://stackoverflow.com/questions/10618001/javascript-mouseover-mouseout-issue-with-child-element
      $('.root').unbind('mouseenter', this.handleEnter);
      $('.root').unbind('dblclick', this.handleClick);
      $(document).unbind('mouseover', this.docMouseOver);

      if (this.state.showMode) {
        $(document).bind('mouseover', this.docMouseOver);
        $('.root').bind('mouseenter', this.handleEnter);
        // 添加双击事件
        $('.root').bind('dblclick', this.handleClick);
      }
    }

    docMouseOver(e) {
      const $target = $(e.target);
      const $parentWrapper = $target.parents('.root');
      if (!$target.hasClass('root') && !$parentWrapper.length) {
        this.setState({
          currentId: null,
          overlay: {
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            text: '',
          },
        });
      }
    }

    toUrl() {
      const _config = this.getURLConfig(config);
      const showMode = !this.getURLData('mode');
      this.setState({
        config: _config,
        showMode,
      });
    }

    getMaskChild(parent, docHeight) {
      let maskChild;
      if (parent.offset().top) {
        maskChild = [
          <div key="1"
            style={{
              height: parent.offset().top,
              top: 0,
              left: 0,
            }}
            visible
          />,
          <div key="2"
            style={{
              height: docHeight - parent.offset().top - parent.height(),
              top: parent.offset().top + parent.height(),
            }}
            visible
          />,
        ];
      } else {
        maskChild = (<div
          style={{ height: docHeight - parent.height(), top: parent.height() }} visible
        />);
      }
      return maskChild;
    }

    handleEnter(e) {
      const $target = $(e.currentTarget);
      const id = $target.attr('id');
      this.setState({
        currentId: id,
        overlay: {
          top: $target.offset().top,
          left: $target.offset().left,
          width: $target.width(),
          height: $target.height(),
          text: id,
        },
      });
    }

    handleClick(e) {
      const $target = $(e.currentTarget);
      // 禁止滚动;
      if (this.state.showMask) {
        $('html').attr('style', '');
        this.config = {};
      } else {
        $('html').css({ overflow: 'hidden' });
      }
      const docHeight = $(document).height();
      const showMask = !this.state.showMask;
      const childId = showMask ? $target.attr('id') : null;
      const maskChild = showMask ? this.getMaskChild($target, docHeight) : null;
      this.setState({
        showMask,
        maskChild,
        maskHeight: docHeight,
        childId,
      });
    }

    getToolChild(configComp) {
      return (this.state.childId ? [
        <TextController
          childId={this.state.childId}
          stateConfig={this.state.config}
          data={configComp.dataSource || []}
          callBack={this.callBack}
          key="0"
          visible
        />,
        <AnimController
          childId={this.state.childId}
          stateConfig={this.state.config}
          data={configComp.variables || []}
          callBack={this.callBack}
          key="1"
          visible
        />,
      ] : null);
    }

    // 数据转换
    convertConfig(data) {
      const convertedState = assign({}, data);
      Object.keys(convertedState).forEach(key => {
        const componentState = typeof convertedState[key] === 'string' ?
          convertedState[key] : assign({}, convertedState[key]);
        const { dataSource, variables } = componentState;
        if (dataSource && dataSource.length > 0) {
          const res = {};
          dataSource.forEach(_item => {
            const item = assign({}, _item);
            if (typeof item.value === 'object') {
              const itemValue = assign({}, item.value);
              Object.keys(itemValue).forEach(_key => {
                itemValue[_key] = itemValue[_key].value;
              });
              item.value = itemValue;
            }
            res[item.key] = item[`${item.key}remove`] ? '$remove' : item.value;
          });
          componentState.dataSource = res;
        }
        if (variables && variables.length > 0) {
          const res = {};
          variables.forEach(item => {
            res[item.key] = item.value;
          });
          componentState.variables = res;
        }
        convertedState[key] = componentState;
      });
      return convertedState;
    }

    render() {
      const toolContent = this.getToolChild(this.state.config[this.state.childId] || {});
      const childToRender = this.state.showMode ? [
        !this.state.showMask && this.state.currentId ?
          <OverLay {...this.state.overlay} visible key="0">
            {this.state.overlay.text}
          </OverLay> : null,
        <Animate showProp="visible" transitionName="zoom" key="tool">
          {toolContent}
        </Animate>,
        <ComposedComponent
          {...this.convertConfig(assign({}, this.state.config))}
          key="comp"
        />,
        <Animate component={Mask} showProp="visible" transitionName="fade"
          style={{ height: this.state.maskHeight }}
          key="mask"
        >
          {this.state.showMask ? this.state.maskChild : null}
        </Animate>,
      ] : (<ComposedComponent
        {...this.convertConfig(assign({}, this.state.config))}
        key="comp"
      />);
      return (
        <div style={{ display: 'inline' }}>
          {childToRender}
          <NavController />
        </div>);
    }
  };


export default motionTool;
