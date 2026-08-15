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

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

export 'common.pbenum.dart';

class Time extends $pb.GeneratedMessage {
  factory Time({
    $fixnum.Int64? millis,
  }) {
    final result = create();
    if (millis != null) result.millis = millis;
    return result;
  }

  Time._();

  factory Time.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Time.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Time',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aInt64(1, _omitFieldNames ? '' : 'millis')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Time clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Time copyWith(void Function(Time) updates) =>
      super.copyWith((message) => updates(message as Time)) as Time;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Time create() => Time._();
  @$core.override
  Time createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Time getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Time>(create);
  static Time? _defaultInstance;

  @$pb.TagNumber(1)
  $fixnum.Int64 get millis => $_getI64(0);
  @$pb.TagNumber(1)
  set millis($fixnum.Int64 value) => $_setInt64(0, value);
  @$pb.TagNumber(1)
  $core.bool hasMillis() => $_has(0);
  @$pb.TagNumber(1)
  void clearMillis() => $_clearField(1);
}

class Size extends $pb.GeneratedMessage {
  factory Size({
    $fixnum.Int64? bytes,
  }) {
    final result = create();
    if (bytes != null) result.bytes = bytes;
    return result;
  }

  Size._();

  factory Size.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Size.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Size',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aInt64(1, _omitFieldNames ? '' : 'bytes')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Size clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Size copyWith(void Function(Size) updates) =>
      super.copyWith((message) => updates(message as Size)) as Size;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Size create() => Size._();
  @$core.override
  Size createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Size getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Size>(create);
  static Size? _defaultInstance;

  @$pb.TagNumber(1)
  $fixnum.Int64 get bytes => $_getI64(0);
  @$pb.TagNumber(1)
  set bytes($fixnum.Int64 value) => $_setInt64(0, value);
  @$pb.TagNumber(1)
  $core.bool hasBytes() => $_has(0);
  @$pb.TagNumber(1)
  void clearBytes() => $_clearField(1);
}

class Failure extends $pb.GeneratedMessage {
  factory Failure({
    $core.String? code,
    $core.String? message,
  }) {
    final result = create();
    if (code != null) result.code = code;
    if (message != null) result.message = message;
    return result;
  }

  Failure._();

  factory Failure.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Failure.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Failure',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'code')
    ..aOS(2, _omitFieldNames ? '' : 'message')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Failure clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Failure copyWith(void Function(Failure) updates) =>
      super.copyWith((message) => updates(message as Failure)) as Failure;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Failure create() => Failure._();
  @$core.override
  Failure createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Failure getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Failure>(create);
  static Failure? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get code => $_getSZ(0);
  @$pb.TagNumber(1)
  set code($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasCode() => $_has(0);
  @$pb.TagNumber(1)
  void clearCode() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get message => $_getSZ(1);
  @$pb.TagNumber(2)
  set message($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasMessage() => $_has(1);
  @$pb.TagNumber(2)
  void clearMessage() => $_clearField(2);
}

class Json extends $pb.GeneratedMessage {
  factory Json({
    $core.List<$core.int>? value,
  }) {
    final result = create();
    if (value != null) result.value = value;
    return result;
  }

  Json._();

  factory Json.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Json.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Json',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..a<$core.List<$core.int>>(
        1, _omitFieldNames ? '' : 'value', $pb.PbFieldType.OY)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Json clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Json copyWith(void Function(Json) updates) =>
      super.copyWith((message) => updates(message as Json)) as Json;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Json create() => Json._();
  @$core.override
  Json createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Json getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Json>(create);
  static Json? _defaultInstance;

  @$pb.TagNumber(1)
  $core.List<$core.int> get value => $_getN(0);
  @$pb.TagNumber(1)
  set value($core.List<$core.int> value) => $_setBytes(0, value);
  @$pb.TagNumber(1)
  $core.bool hasValue() => $_has(0);
  @$pb.TagNumber(1)
  void clearValue() => $_clearField(1);
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
