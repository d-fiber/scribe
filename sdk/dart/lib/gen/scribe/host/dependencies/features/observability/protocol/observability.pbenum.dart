// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/observability/protocol/observability.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

class SpanKind extends $pb.ProtobufEnum {
  static const SpanKind SPAN_KIND_UNSPECIFIED =
      SpanKind._(0, _omitEnumNames ? '' : 'SPAN_KIND_UNSPECIFIED');
  static const SpanKind SPAN_KIND_INTERNAL =
      SpanKind._(1, _omitEnumNames ? '' : 'SPAN_KIND_INTERNAL');
  static const SpanKind SPAN_KIND_CLIENT =
      SpanKind._(2, _omitEnumNames ? '' : 'SPAN_KIND_CLIENT');
  static const SpanKind SPAN_KIND_SERVER =
      SpanKind._(3, _omitEnumNames ? '' : 'SPAN_KIND_SERVER');

  static const $core.List<SpanKind> values = <SpanKind>[
    SPAN_KIND_UNSPECIFIED,
    SPAN_KIND_INTERNAL,
    SPAN_KIND_CLIENT,
    SPAN_KIND_SERVER,
  ];

  static final $core.List<SpanKind?> _byValue =
      $pb.ProtobufEnum.$_initByValueList(values, 3);
  static SpanKind? valueOf($core.int value) =>
      value < 0 || value >= _byValue.length ? null : _byValue[value];

  const SpanKind._(super.value, super.name);
}

const $core.bool _omitEnumNames =
    $core.bool.fromEnvironment('protobuf.omit_enum_names');
