// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/observability/protocol/observability.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;
import 'observability.pbenum.dart';

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

export 'observability.pbenum.dart';

class Span extends $pb.GeneratedMessage {
  factory Span({
    $core.String? traceId,
    $core.String? spanId,
    $core.String? parentSpanId,
    $core.String? name,
    SpanKind? kind,
    $fixnum.Int64? startedAt,
    $fixnum.Int64? endedAt,
    $0.Json? attributes,
    $0.Failure? error,
  }) {
    final result = create();
    if (traceId != null) result.traceId = traceId;
    if (spanId != null) result.spanId = spanId;
    if (parentSpanId != null) result.parentSpanId = parentSpanId;
    if (name != null) result.name = name;
    if (kind != null) result.kind = kind;
    if (startedAt != null) result.startedAt = startedAt;
    if (endedAt != null) result.endedAt = endedAt;
    if (attributes != null) result.attributes = attributes;
    if (error != null) result.error = error;
    return result;
  }

  Span._();

  factory Span.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Span.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Span',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.observability.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'traceId')
    ..aOS(2, _omitFieldNames ? '' : 'spanId')
    ..aOS(3, _omitFieldNames ? '' : 'parentSpanId')
    ..aOS(4, _omitFieldNames ? '' : 'name')
    ..aE<SpanKind>(5, _omitFieldNames ? '' : 'kind',
        enumValues: SpanKind.values)
    ..aInt64(6, _omitFieldNames ? '' : 'startedAt')
    ..aInt64(7, _omitFieldNames ? '' : 'endedAt')
    ..aOM<$0.Json>(8, _omitFieldNames ? '' : 'attributes',
        subBuilder: $0.Json.create)
    ..aOM<$0.Failure>(9, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Span clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Span copyWith(void Function(Span) updates) =>
      super.copyWith((message) => updates(message as Span)) as Span;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Span create() => Span._();
  @$core.override
  Span createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Span getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Span>(create);
  static Span? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get traceId => $_getSZ(0);
  @$pb.TagNumber(1)
  set traceId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasTraceId() => $_has(0);
  @$pb.TagNumber(1)
  void clearTraceId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get spanId => $_getSZ(1);
  @$pb.TagNumber(2)
  set spanId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSpanId() => $_has(1);
  @$pb.TagNumber(2)
  void clearSpanId() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get parentSpanId => $_getSZ(2);
  @$pb.TagNumber(3)
  set parentSpanId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasParentSpanId() => $_has(2);
  @$pb.TagNumber(3)
  void clearParentSpanId() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get name => $_getSZ(3);
  @$pb.TagNumber(4)
  set name($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasName() => $_has(3);
  @$pb.TagNumber(4)
  void clearName() => $_clearField(4);

  @$pb.TagNumber(5)
  SpanKind get kind => $_getN(4);
  @$pb.TagNumber(5)
  set kind(SpanKind value) => $_setField(5, value);
  @$pb.TagNumber(5)
  $core.bool hasKind() => $_has(4);
  @$pb.TagNumber(5)
  void clearKind() => $_clearField(5);

  @$pb.TagNumber(6)
  $fixnum.Int64 get startedAt => $_getI64(5);
  @$pb.TagNumber(6)
  set startedAt($fixnum.Int64 value) => $_setInt64(5, value);
  @$pb.TagNumber(6)
  $core.bool hasStartedAt() => $_has(5);
  @$pb.TagNumber(6)
  void clearStartedAt() => $_clearField(6);

  @$pb.TagNumber(7)
  $fixnum.Int64 get endedAt => $_getI64(6);
  @$pb.TagNumber(7)
  set endedAt($fixnum.Int64 value) => $_setInt64(6, value);
  @$pb.TagNumber(7)
  $core.bool hasEndedAt() => $_has(6);
  @$pb.TagNumber(7)
  void clearEndedAt() => $_clearField(7);

  @$pb.TagNumber(8)
  $0.Json get attributes => $_getN(7);
  @$pb.TagNumber(8)
  set attributes($0.Json value) => $_setField(8, value);
  @$pb.TagNumber(8)
  $core.bool hasAttributes() => $_has(7);
  @$pb.TagNumber(8)
  void clearAttributes() => $_clearField(8);
  @$pb.TagNumber(8)
  $0.Json ensureAttributes() => $_ensure(7);

  @$pb.TagNumber(9)
  $0.Failure get error => $_getN(8);
  @$pb.TagNumber(9)
  set error($0.Failure value) => $_setField(9, value);
  @$pb.TagNumber(9)
  $core.bool hasError() => $_has(8);
  @$pb.TagNumber(9)
  void clearError() => $_clearField(9);
  @$pb.TagNumber(9)
  $0.Failure ensureError() => $_ensure(8);
}

class SpanBatch extends $pb.GeneratedMessage {
  factory SpanBatch({
    $core.Iterable<Span>? spans,
  }) {
    final result = create();
    if (spans != null) result.spans.addAll(spans);
    return result;
  }

  SpanBatch._();

  factory SpanBatch.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SpanBatch.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SpanBatch',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.observability.v1'),
      createEmptyInstance: create)
    ..pPM<Span>(1, _omitFieldNames ? '' : 'spans', subBuilder: Span.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SpanBatch clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SpanBatch copyWith(void Function(SpanBatch) updates) =>
      super.copyWith((message) => updates(message as SpanBatch)) as SpanBatch;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SpanBatch create() => SpanBatch._();
  @$core.override
  SpanBatch createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SpanBatch getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SpanBatch>(create);
  static SpanBatch? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Span> get spans => $_getList(0);
}

class SpanAck extends $pb.GeneratedMessage {
  factory SpanAck() => create();

  SpanAck._();

  factory SpanAck.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SpanAck.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SpanAck',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.observability.v1'),
      createEmptyInstance: create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SpanAck clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SpanAck copyWith(void Function(SpanAck) updates) =>
      super.copyWith((message) => updates(message as SpanAck)) as SpanAck;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SpanAck create() => SpanAck._();
  @$core.override
  SpanAck createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SpanAck getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SpanAck>(create);
  static SpanAck? _defaultInstance;
}

class ObservabilityApi {
  final $pb.RpcClient _client;

  ObservabilityApi(this._client);

  $async.Future<SpanAck> ship($pb.ClientContext? ctx, SpanBatch request) =>
      _client.invoke<SpanAck>(ctx, 'Observability', 'Ship', request, SpanAck());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
