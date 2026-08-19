// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/realtime/protocol/realtime.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class BroadcastRequest extends $pb.GeneratedMessage {
  factory BroadcastRequest({
    $core.String? channel,
    $core.String? action,
    $core.String? entityId,
    $0.Json? payload,
  }) {
    final result = create();
    if (channel != null) result.channel = channel;
    if (action != null) result.action = action;
    if (entityId != null) result.entityId = entityId;
    if (payload != null) result.payload = payload;
    return result;
  }

  BroadcastRequest._();

  factory BroadcastRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BroadcastRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BroadcastRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'channel')
    ..aOS(2, _omitFieldNames ? '' : 'action')
    ..aOS(3, _omitFieldNames ? '' : 'entityId')
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'payload',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BroadcastRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BroadcastRequest copyWith(void Function(BroadcastRequest) updates) =>
      super.copyWith((message) => updates(message as BroadcastRequest))
          as BroadcastRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BroadcastRequest create() => BroadcastRequest._();
  @$core.override
  BroadcastRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BroadcastRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BroadcastRequest>(create);
  static BroadcastRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get channel => $_getSZ(0);
  @$pb.TagNumber(1)
  set channel($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasChannel() => $_has(0);
  @$pb.TagNumber(1)
  void clearChannel() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get action => $_getSZ(1);
  @$pb.TagNumber(2)
  set action($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasAction() => $_has(1);
  @$pb.TagNumber(2)
  void clearAction() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get entityId => $_getSZ(2);
  @$pb.TagNumber(3)
  set entityId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasEntityId() => $_has(2);
  @$pb.TagNumber(3)
  void clearEntityId() => $_clearField(3);

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
}

class BroadcastResult extends $pb.GeneratedMessage {
  factory BroadcastResult({
    $core.int? delivered,
    $0.Failure? error,
  }) {
    final result = create();
    if (delivered != null) result.delivered = delivered;
    if (error != null) result.error = error;
    return result;
  }

  BroadcastResult._();

  factory BroadcastResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BroadcastResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BroadcastResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'delivered', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BroadcastResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BroadcastResult copyWith(void Function(BroadcastResult) updates) =>
      super.copyWith((message) => updates(message as BroadcastResult))
          as BroadcastResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BroadcastResult create() => BroadcastResult._();
  @$core.override
  BroadcastResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BroadcastResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BroadcastResult>(create);
  static BroadcastResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get delivered => $_getIZ(0);
  @$pb.TagNumber(1)
  set delivered($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasDelivered() => $_has(0);
  @$pb.TagNumber(1)
  void clearDelivered() => $_clearField(1);

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

class GrantRequest extends $pb.GeneratedMessage {
  factory GrantRequest({
    $core.String? channel,
    $core.Iterable<$core.String>? accountIds,
  }) {
    final result = create();
    if (channel != null) result.channel = channel;
    if (accountIds != null) result.accountIds.addAll(accountIds);
    return result;
  }

  GrantRequest._();

  factory GrantRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GrantRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GrantRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'channel')
    ..pPS(2, _omitFieldNames ? '' : 'accountIds')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GrantRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GrantRequest copyWith(void Function(GrantRequest) updates) =>
      super.copyWith((message) => updates(message as GrantRequest))
          as GrantRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GrantRequest create() => GrantRequest._();
  @$core.override
  GrantRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GrantRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GrantRequest>(create);
  static GrantRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get channel => $_getSZ(0);
  @$pb.TagNumber(1)
  set channel($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasChannel() => $_has(0);
  @$pb.TagNumber(1)
  void clearChannel() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get accountIds => $_getList(1);
}

class GrantResult extends $pb.GeneratedMessage {
  factory GrantResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  GrantResult._();

  factory GrantResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GrantResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GrantResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GrantResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GrantResult copyWith(void Function(GrantResult) updates) =>
      super.copyWith((message) => updates(message as GrantResult))
          as GrantResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GrantResult create() => GrantResult._();
  @$core.override
  GrantResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GrantResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GrantResult>(create);
  static GrantResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Failure get error => $_getN(0);
  @$pb.TagNumber(1)
  set error($0.Failure value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasError() => $_has(0);
  @$pb.TagNumber(1)
  void clearError() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Failure ensureError() => $_ensure(0);
}

class RealtimeApi {
  final $pb.RpcClient _client;

  RealtimeApi(this._client);

  $async.Future<BroadcastResult> broadcast(
          $pb.ClientContext? ctx, BroadcastRequest request) =>
      _client.invoke<BroadcastResult>(
          ctx, 'Realtime', 'Broadcast', request, BroadcastResult());
  $async.Future<GrantResult> grant(
          $pb.ClientContext? ctx, GrantRequest request) =>
      _client.invoke<GrantResult>(
          ctx, 'Realtime', 'Grant', request, GrantResult());
  $async.Future<GrantResult> revoke(
          $pb.ClientContext? ctx, GrantRequest request) =>
      _client.invoke<GrantResult>(
          ctx, 'Realtime', 'Revoke', request, GrantResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
