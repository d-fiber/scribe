// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/hook/hook.proto.

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

import '../../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Event extends $pb.GeneratedMessage {
  factory Event({
    $core.String? hookId,
    $core.String? event,
    $core.String? traceId,
    $0.Json? payload,
    $fixnum.Int64? emittedAt,
    $core.String? capabilityToken,
  }) {
    final result = create();
    if (hookId != null) result.hookId = hookId;
    if (event != null) result.event = event;
    if (traceId != null) result.traceId = traceId;
    if (payload != null) result.payload = payload;
    if (emittedAt != null) result.emittedAt = emittedAt;
    if (capabilityToken != null) result.capabilityToken = capabilityToken;
    return result;
  }

  Event._();

  factory Event.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Event.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Event',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.hook.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'hookId')
    ..aOS(2, _omitFieldNames ? '' : 'event')
    ..aOS(3, _omitFieldNames ? '' : 'traceId')
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'payload',
        subBuilder: $0.Json.create)
    ..aInt64(5, _omitFieldNames ? '' : 'emittedAt')
    ..aOS(6, _omitFieldNames ? '' : 'capabilityToken')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Event clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Event copyWith(void Function(Event) updates) =>
      super.copyWith((message) => updates(message as Event)) as Event;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Event create() => Event._();
  @$core.override
  Event createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Event getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Event>(create);
  static Event? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get hookId => $_getSZ(0);
  @$pb.TagNumber(1)
  set hookId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasHookId() => $_has(0);
  @$pb.TagNumber(1)
  void clearHookId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get event => $_getSZ(1);
  @$pb.TagNumber(2)
  set event($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasEvent() => $_has(1);
  @$pb.TagNumber(2)
  void clearEvent() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get traceId => $_getSZ(2);
  @$pb.TagNumber(3)
  set traceId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasTraceId() => $_has(2);
  @$pb.TagNumber(3)
  void clearTraceId() => $_clearField(3);

  @$pb.TagNumber(4)
  $0.Json get payload => $_getN(3);
  @$pb.TagNumber(4)
  set payload($0.Json value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasPayload() => $_has(3);
  @$pb.TagNumber(4)
  void clearPayload() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Json ensurePayload() => $_ensure(3);

  @$pb.TagNumber(5)
  $fixnum.Int64 get emittedAt => $_getI64(4);
  @$pb.TagNumber(5)
  set emittedAt($fixnum.Int64 value) => $_setInt64(4, value);
  @$pb.TagNumber(5)
  $core.bool hasEmittedAt() => $_has(4);
  @$pb.TagNumber(5)
  void clearEmittedAt() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.String get capabilityToken => $_getSZ(5);
  @$pb.TagNumber(6)
  set capabilityToken($core.String value) => $_setString(5, value);
  @$pb.TagNumber(6)
  $core.bool hasCapabilityToken() => $_has(5);
  @$pb.TagNumber(6)
  void clearCapabilityToken() => $_clearField(6);
}

class EmitResult extends $pb.GeneratedMessage {
  factory EmitResult({
    $core.int? handled,
    $0.Failure? error,
  }) {
    final result = create();
    if (handled != null) result.handled = handled;
    if (error != null) result.error = error;
    return result;
  }

  EmitResult._();

  factory EmitResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory EmitResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'EmitResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.hook.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'handled', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  EmitResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  EmitResult copyWith(void Function(EmitResult) updates) =>
      super.copyWith((message) => updates(message as EmitResult)) as EmitResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static EmitResult create() => EmitResult._();
  @$core.override
  EmitResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static EmitResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<EmitResult>(create);
  static EmitResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get handled => $_getIZ(0);
  @$pb.TagNumber(1)
  set handled($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasHandled() => $_has(0);
  @$pb.TagNumber(1)
  void clearHandled() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class HandleResult extends $pb.GeneratedMessage {
  factory HandleResult({
    $core.bool? halted,
    $0.Json? mutation,
    $0.Failure? error,
  }) {
    final result = create();
    if (halted != null) result.halted = halted;
    if (mutation != null) result.mutation = mutation;
    if (error != null) result.error = error;
    return result;
  }

  HandleResult._();

  factory HandleResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory HandleResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'HandleResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.hook.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'halted')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'mutation',
        subBuilder: $0.Json.create)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HandleResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HandleResult copyWith(void Function(HandleResult) updates) =>
      super.copyWith((message) => updates(message as HandleResult))
          as HandleResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static HandleResult create() => HandleResult._();
  @$core.override
  HandleResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static HandleResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<HandleResult>(create);
  static HandleResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get halted => $_getBF(0);
  @$pb.TagNumber(1)
  set halted($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasHalted() => $_has(0);
  @$pb.TagNumber(1)
  void clearHalted() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get mutation => $_getN(1);
  @$pb.TagNumber(2)
  set mutation($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasMutation() => $_has(1);
  @$pb.TagNumber(2)
  void clearMutation() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureMutation() => $_ensure(1);

  @$pb.TagNumber(3)
  $0.Failure get error => $_getN(2);
  @$pb.TagNumber(3)
  set error($0.Failure value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasError() => $_has(2);
  @$pb.TagNumber(3)
  void clearError() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Failure ensureError() => $_ensure(2);
}

class HookApi {
  final $pb.RpcClient _client;

  HookApi(this._client);

  $async.Future<EmitResult> emit($pb.ClientContext? ctx, Event request) =>
      _client.invoke<EmitResult>(ctx, 'Hook', 'Emit', request, EmitResult());
}

class HookDispatchApi {
  final $pb.RpcClient _client;

  HookDispatchApi(this._client);

  $async.Future<HandleResult> handle($pb.ClientContext? ctx, Event request) =>
      _client.invoke<HandleResult>(
          ctx, 'HookDispatch', 'Handle', request, HandleResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
