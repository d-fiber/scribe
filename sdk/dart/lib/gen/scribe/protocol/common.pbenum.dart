// This is a generated file - do not edit.
//
// Generated from scribe/protocol/common.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class Caller extends $pb.ProtobufEnum {
  static const Caller CALLER_UNSPECIFIED =
      Caller._(0, _omitEnumNames ? '' : 'CALLER_UNSPECIFIED');
  static const Caller CALLER_ANONYMOUS =
      Caller._(1, _omitEnumNames ? '' : 'CALLER_ANONYMOUS');
  static const Caller CALLER_USER =
      Caller._(2, _omitEnumNames ? '' : 'CALLER_USER');
  static const Caller CALLER_ADMIN =
      Caller._(3, _omitEnumNames ? '' : 'CALLER_ADMIN');
  static const Caller CALLER_SERVICE =
      Caller._(4, _omitEnumNames ? '' : 'CALLER_SERVICE');
  static const Caller CALLER_WEBHOOK =
      Caller._(5, _omitEnumNames ? '' : 'CALLER_WEBHOOK');

  static const $core.List<Caller> values = <Caller>[
    CALLER_UNSPECIFIED,
    CALLER_ANONYMOUS,
    CALLER_USER,
    CALLER_ADMIN,
    CALLER_SERVICE,
    CALLER_WEBHOOK,
  ];

  static final $core.List<Caller?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 5);
  static Caller? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const Caller._(super.value, super.name);
}

class Method extends $pb.ProtobufEnum {
  static const Method METHOD_UNSPECIFIED =
      Method._(0, _omitEnumNames ? '' : 'METHOD_UNSPECIFIED');
  static const Method METHOD_GET =
      Method._(1, _omitEnumNames ? '' : 'METHOD_GET');
  static const Method METHOD_POST =
      Method._(2, _omitEnumNames ? '' : 'METHOD_POST');
  static const Method METHOD_PUT =
      Method._(3, _omitEnumNames ? '' : 'METHOD_PUT');
  static const Method METHOD_PATCH =
      Method._(4, _omitEnumNames ? '' : 'METHOD_PATCH');
  static const Method METHOD_DELETE =
      Method._(5, _omitEnumNames ? '' : 'METHOD_DELETE');

  static const $core.List<Method> values = <Method>[
    METHOD_UNSPECIFIED,
    METHOD_GET,
    METHOD_POST,
    METHOD_PUT,
    METHOD_PATCH,
    METHOD_DELETE,
  ];

  static final $core.List<Method?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 5);
  static Method? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const Method._(super.value, super.name);
}

class Need extends $pb.ProtobufEnum {
  static const Need NEED_UNSPECIFIED =
      Need._(0, _omitEnumNames ? '' : 'NEED_UNSPECIFIED');
  static const Need NEED_DEVICE =
      Need._(1, _omitEnumNames ? '' : 'NEED_DEVICE');
  static const Need NEED_LOCATION =
      Need._(2, _omitEnumNames ? '' : 'NEED_LOCATION');

  static const $core.List<Need> values = <Need>[
    NEED_UNSPECIFIED,
    NEED_DEVICE,
    NEED_LOCATION,
  ];

  static final $core.List<Need?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 2);
  static Need? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const Need._(super.value, super.name);
}

const $core.bool _omitEnumNames =
    $core.bool.fromEnvironment('protobuf.omit_enum_names');
