import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  View,
  TextInput,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';

import Line from '../line';
import Label from '../label';
import Helper from '../helper';
import Counter from '../counter';

import styles from './styles.js';

export default class TextField extends PureComponent {
  static defaultProps = {
    underlineColorAndroid: 'transparent',
    disableFullscreenUI: true,
    autoCapitalize: 'sentences',
    blurOnSubmit: true,
    editable: true,

    animationDuration: 225,

    fontSize: 16,

    tintColor: 'rgb(0, 145, 234)',
    textColor: 'rgba(0, 0, 0, .87)',
    baseColor: 'rgba(0, 0, 0, .38)',

    errorColor: 'rgb(213, 0, 0)',

    disabled: false,
  };

  static propTypes = {
    ...TextInput.propTypes,

    animationDuration: PropTypes.number,

    fontSize: PropTypes.number,

    tintColor: PropTypes.string,
    textColor: PropTypes.string,
    baseColor: PropTypes.string,

    label: PropTypes.string.isRequired,
    title: PropTypes.string,

    characterRestriction: PropTypes.number,

    error: PropTypes.string,
    errorColor: PropTypes.string,

    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onPress = this.focus.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onContentSizeChange = this.onContentSizeChange.bind(this);

    this.updateRef = this.updateRef.bind(this, 'input');

    let { value, error } = this.props;

    this.mounted = false;
    this.state = {
      text: value,

      focus: new Animated.Value(error? -1 : 0),
      focused: false,

      error: error,
      errored: !!error,

      height: 24,
    };
  }

  componentWillReceiveProps(props) {
    let { text, error } = this.state;

    if (null != props.value && props.value !== text) {
      this.setState({ text: props.value });
    }

    if (props.error && props.error !== error) {
      this.setState({ error: props.error });
    }

    if (props.error !== this.props.error) {
      this.setState({ errored: !!props.error });
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentWillUpdate(props, state) {
    let { error, animationDuration } = this.props;
    let { focus, focused } = this.state;

    if (props.error !== error || focused ^ state.focused) {
      Animated
        .timing(focus, {
          toValue: props.error? -1 : (state.focused? 1 : 0),
          duration: animationDuration,
          easing: Easing.inOut(Easing.ease),
        })
        .start(() => {
          if (this.mounted) {
            this.setState((state, { error }) => ({ error }));
          }
        });
    }
  }

  updateRef(name, ref) {
    this[name] = ref;
  }

  focus() {
    let { disabled, editable } = this.props;

    if (!disabled && editable) {
      this.input.focus();
    }
  }

  blur() {
    this.input.blur();
  }

  clear() {
    this.input.clear();
  }

  value() {
    return this.state.text;
  }

  isFocused() {
    return this.input.isFocused();
  }

  isRestricted() {
    let { characterRestriction } = this.props;
    let { text = '' } = this.state;

    return characterRestriction < text.length;
  }

  onFocus() {
    let { onFocus } = this.props;

    if ('function' === typeof onFocus) {
      onFocus();
    }

    this.setState({ focused: true });
  }

  onBlur() {
    let { onBlur } = this.props;

    if ('function' === typeof onBlur) {
      onBlur();
    }

    this.setState({ focused: false });
  }

  onChange(event) {
    let { onChange, multiline } = this.props;

    if ('function' === typeof onChange) {
      onChange(event);
    }

    /* XXX: onContentSizeChange is not called on RN 0.44 */
    if (multiline && 'android' === Platform.OS) {
      this.onContentSizeChange(event);
    }
  }

  onChangeText(text) {
    let { onChangeText } = this.props;

    if ('function' === typeof onChangeText) {
      onChangeText(text);
    }

    this.setState({ text });
  }

  onContentSizeChange({ nativeEvent }) {
    let { height } = nativeEvent.contentSize;

    this.setState({ height: Math.ceil(height) });
  }

  render() {
    let { focused, focus, error, errored, height, text = '' } = this.state;
    let {
      style,
      label,
      title,
      characterRestriction: limit,
      editable,
      disabled,
      animationDuration,
      fontSize,
      tintColor,
      baseColor,
      textColor,
      errorColor,
      ...props
    } = this.props;

    let count = text.length;
    let active = !!text;
    let restricted = limit < count;

    let borderBottomColor = restricted?
      errorColor:
      focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [errorColor, baseColor, tintColor],
      });

    let borderBottomWidth = restricted?
      2:
      focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [2, StyleSheet.hairlineWidth, 2],
      });

    let containerStyle = {
      ...(disabled?
        { overflow: 'hidden' }:
        { borderBottomColor, borderBottomWidth }),

      ...(props.multiline?
        { height: 40 + height }:
        { height: 40 + fontSize * 1.5 }),
    };

    let inputStyle = {
      fontSize,

      color: disabled?
        baseColor:
        textColor,

      ...(props.multiline?
        {
          height: fontSize * 1.5 + height,

          ...Platform.select({
            ios: { left: 1, top: -1 },
            android: { textAlignVertical: 'top' },
          }),
        }:
        { height: fontSize * 1.5 }),
    };

    let errorStyle = {
      color: errorColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [1, 0, 0],
      }),

      fontSize: title?
        12:
        focus.interpolate({
          inputRange:  [-1, 0, 1],
          outputRange: [12, 0, 0],
        }),
    };

    let titleStyle = {
      color: baseColor,

      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 1],
      }),

      fontSize: 12,
    };

    let helperContainerStyle = {
      flexDirection: 'row',
      height: (title || limit)?
        24:
        focus.interpolate({
          inputRange:  [-1, 0, 1],
          outputRange: [24, 8, 8],
        }),
    };

    let labelProps = {
      fontSize,
      tintColor,
      baseColor,
      errorColor,
      animationDuration,
      active,
      focused,
      errored,
      restricted,
    };

    return (
      <View onStartShouldSetResponder={ () => true } onResponderRelease={this.onPress}>
        <Animated.View style={[styles.container, containerStyle]}>
          {disabled && <Line type='dotted' color={baseColor} />}

          <Label {...labelProps}>{label}</Label>

          <TextInput
            style={[styles.input, inputStyle, style]}
            selectionColor={tintColor}

            {...props}

            editable={!disabled && editable}
            onChange={this.onChange}
            onChangeText={this.onChangeText}
            onContentSizeChange={this.onContentSizeChange}
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            value={this.props.value}
            ref={this.updateRef}
          />
        </Animated.View>

        <Animated.View style={helperContainerStyle}>
          <View style={styles.flex}>
            <Helper style={errorStyle} text={error} />
            <Helper style={titleStyle} text={title} />
          </View>

          <Counter {...{ baseColor, errorColor, count, limit }} />
        </Animated.View>
      </View>
    );
  }
}
