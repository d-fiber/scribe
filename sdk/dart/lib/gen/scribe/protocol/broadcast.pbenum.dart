// This is a generated file - do not edit.
//
// Generated from scribe/protocol/broadcast.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class EventScope extends $pb.ProtobufEnum {
  static const EventScope EVENT_SCOPE_UNSPECIFIED =
      EventScope._(0, _omitEnumNames ? '' : 'EVENT_SCOPE_UNSPECIFIED');
  static const EventScope EVENT_SCOPE_ADMIN =
      EventScope._(1, _omitEnumNames ? '' : 'EVENT_SCOPE_ADMIN');
  static const EventScope EVENT_SCOPE_USER =
      EventScope._(2, _omitEnumNames ? '' : 'EVENT_SCOPE_USER');
  static const EventScope EVENT_SCOPE_ADMINS =
      EventScope._(3, _omitEnumNames ? '' : 'EVENT_SCOPE_ADMINS');
  static const EventScope EVENT_SCOPE_USERS =
      EventScope._(4, _omitEnumNames ? '' : 'EVENT_SCOPE_USERS');

  static const $core.List<EventScope> values = <EventScope>[
    EVENT_SCOPE_UNSPECIFIED,
    EVENT_SCOPE_ADMIN,
    EVENT_SCOPE_USER,
    EVENT_SCOPE_ADMINS,
    EVENT_SCOPE_USERS,
  ];

  static final $core.List<EventScope?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 4);
  static EventScope? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const EventScope._(super.value, super.name);
}

const $core.bool _omitEnumNames =
    $core.bool.fromEnvironment('protobuf.omit_enum_names');
