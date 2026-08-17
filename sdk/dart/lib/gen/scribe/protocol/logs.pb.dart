// This is a generated file - do not edit.
//
// Generated from scribe/protocol/logs.proto.

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

import 'common.pb.dart' as $0;
import 'logs.pbenum.dart';

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

export 'logs.pbenum.dart';

class LogEntry extends $pb.GeneratedMessage {
  factory LogEntry({
    LogLevel? level,
    $core.String? action,
    $core.String? actorType,
    $core.String? actorId,
    $0.Json? metadata,
    $fixnum.Int64? timestamp,
    $core.String? traceId,
    $core.String? invocationId,
    $core.String? node,
  }) {
    final result = create();
    if (level != null) result.level = level;
    if (action != null) result.action = action;
    if (actorType != null) result.actorType = actorType;
    if (actorId != null) result.actorId = actorId;
    if (metadata != null) result.metadata = metadata;
    if (timestamp != null) result.timestamp = timestamp;
    if (traceId != null) result.traceId = traceId;
    if (invocationId != null) result.invocationId = invocationId;
    if (node != null) result.node = node;
    return result;
  }

  LogEntry._();

  factory LogEntry.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LogEntry.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LogEntry',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aE<LogLevel>(1, _omitFieldNames ? '' : 'level',
        enumValues: LogLevel.values)
    ..aOS(2, _omitFieldNames ? '' : 'action')
    ..aOS(3, _omitFieldNames ? '' : 'actorType')
    ..aOS(4, _omitFieldNames ? '' : 'actorId')
    ..aOM<$0.Json>(5, _omitFieldNames ? '' : 'metadata',
        subBuilder: $0.Json.create)
    ..aInt64(6, _omitFieldNames ? '' : 'timestamp')
    ..aOS(7, _omitFieldNames ? '' : 'traceId')
    ..aOS(8, _omitFieldNames ? '' : 'invocationId')
    ..aOS(9, _omitFieldNames ? '' : 'node')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogEntry clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogEntry copyWith(void Function(LogEntry) updates) =>
      super.copyWith((message) => updates(message as LogEntry)) as LogEntry;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LogEntry create() => LogEntry._();
  @$core.override
  LogEntry createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LogEntry getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<LogEntry>(create);
  static LogEntry? _defaultInstance;

  @$pb.TagNumber(1)
  LogLevel get level => $_getN(0);
  @$pb.TagNumber(1)
  set level(LogLevel value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasLevel() => $_has(0);
  @$pb.TagNumber(1)
  void clearLevel() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get action => $_getSZ(1);
  @$pb.TagNumber(2)
  set action($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasAction() => $_has(1);
  @$pb.TagNumber(2)
  void clearAction() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get actorType => $_getSZ(2);
  @$pb.TagNumber(3)
  set actorType($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasActorType() => $_has(2);
  @$pb.TagNumber(3)
  void clearActorType() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get actorId => $_getSZ(3);
  @$pb.TagNumber(4)
  set actorId($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasActorId() => $_has(3);
  @$pb.TagNumber(4)
  void clearActorId() => $_clearField(4);

  @$pb.TagNumber(5)
  $0.Json get metadata => $_getN(4);
  @$pb.TagNumber(5)
  set metadata($0.Json value) => $_setField(5, value);
  @$pb.TagNumber(5)
  $core.bool hasMetadata() => $_has(4);
  @$pb.TagNumber(5)
  void clearMetadata() => $_clearField(5);
  @$pb.TagNumber(5)
  $0.Json ensureMetadata() => $_ensure(4);

  @$pb.TagNumber(6)
  $fixnum.Int64 get timestamp => $_getI64(5);
  @$pb.TagNumber(6)
  set timestamp($fixnum.Int64 value) => $_setInt64(5, value);
  @$pb.TagNumber(6)
  $core.bool hasTimestamp() => $_has(5);
  @$pb.TagNumber(6)
  void clearTimestamp() => $_clearField(6);

  @$pb.TagNumber(7)
  $core.String get traceId => $_getSZ(6);
  @$pb.TagNumber(7)
  set traceId($core.String value) => $_setString(6, value);
  @$pb.TagNumber(7)
  $core.bool hasTraceId() => $_has(6);
  @$pb.TagNumber(7)
  void clearTraceId() => $_clearField(7);

  @$pb.TagNumber(8)
  $core.String get invocationId => $_getSZ(7);
  @$pb.TagNumber(8)
  set invocationId($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasInvocationId() => $_has(7);
  @$pb.TagNumber(8)
  void clearInvocationId() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.String get node => $_getSZ(8);
  @$pb.TagNumber(9)
  set node($core.String value) => $_setString(8, value);
  @$pb.TagNumber(9)
  $core.bool hasNode() => $_has(8);
  @$pb.TagNumber(9)
  void clearNode() => $_clearField(9);
}

class LogBatch extends $pb.GeneratedMessage {
  factory LogBatch({
    $core.Iterable<LogEntry>? entries,
  }) {
    final result = create();
    if (entries != null) result.entries.addAll(entries);
    return result;
  }

  LogBatch._();

  factory LogBatch.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LogBatch.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LogBatch',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..pPM<LogEntry>(1, _omitFieldNames ? '' : 'entries',
        subBuilder: LogEntry.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogBatch clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogBatch copyWith(void Function(LogBatch) updates) =>
      super.copyWith((message) => updates(message as LogBatch)) as LogBatch;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LogBatch create() => LogBatch._();
  @$core.override
  LogBatch createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LogBatch getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<LogBatch>(create);
  static LogBatch? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<LogEntry> get entries => $_getList(0);
}

class LogAck extends $pb.GeneratedMessage {
  factory LogAck() => create();

  LogAck._();

  factory LogAck.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LogAck.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LogAck',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogAck clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogAck copyWith(void Function(LogAck) updates) =>
      super.copyWith((message) => updates(message as LogAck)) as LogAck;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LogAck create() => LogAck._();
  @$core.override
  LogAck createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LogAck getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<LogAck>(create);
  static LogAck? _defaultInstance;
}

class LogDelivery extends $pb.GeneratedMessage {
  factory LogDelivery({
    $core.String? node,
    $core.Iterable<LogEntry>? entries,
  }) {
    final result = create();
    if (node != null) result.node = node;
    if (entries != null) result.entries.addAll(entries);
    return result;
  }

  LogDelivery._();

  factory LogDelivery.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LogDelivery.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LogDelivery',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'node')
    ..pPM<LogEntry>(2, _omitFieldNames ? '' : 'entries',
        subBuilder: LogEntry.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogDelivery clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogDelivery copyWith(void Function(LogDelivery) updates) =>
      super.copyWith((message) => updates(message as LogDelivery))
          as LogDelivery;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LogDelivery create() => LogDelivery._();
  @$core.override
  LogDelivery createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LogDelivery getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<LogDelivery>(create);
  static LogDelivery? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get node => $_getSZ(0);
  @$pb.TagNumber(1)
  set node($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasNode() => $_has(0);
  @$pb.TagNumber(1)
  void clearNode() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<LogEntry> get entries => $_getList(1);
}

class LogDeliveryAck extends $pb.GeneratedMessage {
  factory LogDeliveryAck() => create();

  LogDeliveryAck._();

  factory LogDeliveryAck.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LogDeliveryAck.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LogDeliveryAck',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogDeliveryAck clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LogDeliveryAck copyWith(void Function(LogDeliveryAck) updates) =>
      super.copyWith((message) => updates(message as LogDeliveryAck))
          as LogDeliveryAck;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LogDeliveryAck create() => LogDeliveryAck._();
  @$core.override
  LogDeliveryAck createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LogDeliveryAck getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<LogDeliveryAck>(create);
  static LogDeliveryAck? _defaultInstance;
}

/// Worker to host: what the project logged through the SDK, on its way to the
/// host's shipper.
class LoggingApi {
  final $pb.RpcClient _client;

  LoggingApi(this._client);

  $async.Future<LogAck> ship($pb.ClientContext? ctx, LogBatch request) =>
      _client.invoke<LogAck>(ctx, 'Logging', 'Ship', request, LogAck());
}

/// Host to worker: the entries a `_log.ts` declared it would take.
///
/// The reverse direction of Logging.Ship, and the reason both exist: the access
/// log is produced where the exchange happens, which is the host, while the sink
/// that decides what to do with it is project code, which runs in the worker.
class LogDispatchApi {
  final $pb.RpcClient _client;

  LogDispatchApi(this._client);

  $async.Future<LogDeliveryAck> handle(
          $pb.ClientContext? ctx, LogDelivery request) =>
      _client.invoke<LogDeliveryAck>(
          ctx, 'LogDispatch', 'Handle', request, LogDeliveryAck());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
