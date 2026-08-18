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

import '../../../../protocol/broadcast.pbenum.dart' as $1;
import '../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Target extends $pb.GeneratedMessage {
  factory Target({
    $1.EventScope? scope,
    $core.Iterable<$core.String>? ids,
    $core.String? topic,
  }) {
    final result = create();
    if (scope != null) result.scope = scope;
    if (ids != null) result.ids.addAll(ids);
    if (topic != null) result.topic = topic;
    return result;
  }

  Target._();

  factory Target.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Target.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Target',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aE<$1.EventScope>(1, _omitFieldNames ? '' : 'scope',
        enumValues: $1.EventScope.values)
    ..pPS(2, _omitFieldNames ? '' : 'ids')
    ..aOS(3, _omitFieldNames ? '' : 'topic')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Target clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Target copyWith(void Function(Target) updates) =>
      super.copyWith((message) => updates(message as Target)) as Target;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Target create() => Target._();
  @$core.override
  Target createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Target getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Target>(create);
  static Target? _defaultInstance;

  @$pb.TagNumber(1)
  $1.EventScope get scope => $_getN(0);
  @$pb.TagNumber(1)
  set scope($1.EventScope value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasScope() => $_has(0);
  @$pb.TagNumber(1)
  void clearScope() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get ids => $_getList(1);

  @$pb.TagNumber(3)
  $core.String get topic => $_getSZ(2);
  @$pb.TagNumber(3)
  set topic($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasTopic() => $_has(2);
  @$pb.TagNumber(3)
  void clearTopic() => $_clearField(3);
}

class BroadcastRequest extends $pb.GeneratedMessage {
  factory BroadcastRequest({
    $core.String? entity,
    $core.String? event,
    Target? target,
    $0.Json? payload,
  }) {
    final result = create();
    if (entity != null) result.entity = entity;
    if (event != null) result.event = event;
    if (target != null) result.target = target;
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
    ..aOS(1, _omitFieldNames ? '' : 'entity')
    ..aOS(2, _omitFieldNames ? '' : 'event')
    ..aOM<Target>(3, _omitFieldNames ? '' : 'target', subBuilder: Target.create)
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
  $core.String get entity => $_getSZ(0);
  @$pb.TagNumber(1)
  set entity($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasEntity() => $_has(0);
  @$pb.TagNumber(1)
  void clearEntity() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get event => $_getSZ(1);
  @$pb.TagNumber(2)
  set event($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasEvent() => $_has(1);
  @$pb.TagNumber(2)
  void clearEvent() => $_clearField(2);

  @$pb.TagNumber(3)
  Target get target => $_getN(2);
  @$pb.TagNumber(3)
  set target(Target value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasTarget() => $_has(2);
  @$pb.TagNumber(3)
  void clearTarget() => $_clearField(3);
  @$pb.TagNumber(3)
  Target ensureTarget() => $_ensure(2);

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

class TopicMembershipRequest extends $pb.GeneratedMessage {
  factory TopicMembershipRequest({
    $core.String? topic,
    $core.Iterable<$core.String>? memberIds,
  }) {
    final result = create();
    if (topic != null) result.topic = topic;
    if (memberIds != null) result.memberIds.addAll(memberIds);
    return result;
  }

  TopicMembershipRequest._();

  factory TopicMembershipRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory TopicMembershipRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'TopicMembershipRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'topic')
    ..pPS(2, _omitFieldNames ? '' : 'memberIds')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  TopicMembershipRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  TopicMembershipRequest copyWith(
          void Function(TopicMembershipRequest) updates) =>
      super.copyWith((message) => updates(message as TopicMembershipRequest))
          as TopicMembershipRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static TopicMembershipRequest create() => TopicMembershipRequest._();
  @$core.override
  TopicMembershipRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static TopicMembershipRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<TopicMembershipRequest>(create);
  static TopicMembershipRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get topic => $_getSZ(0);
  @$pb.TagNumber(1)
  set topic($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasTopic() => $_has(0);
  @$pb.TagNumber(1)
  void clearTopic() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get memberIds => $_getList(1);
}

class TopicMembershipResult extends $pb.GeneratedMessage {
  factory TopicMembershipResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  TopicMembershipResult._();

  factory TopicMembershipResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory TopicMembershipResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'TopicMembershipResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.realtime.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  TopicMembershipResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  TopicMembershipResult copyWith(
          void Function(TopicMembershipResult) updates) =>
      super.copyWith((message) => updates(message as TopicMembershipResult))
          as TopicMembershipResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static TopicMembershipResult create() => TopicMembershipResult._();
  @$core.override
  TopicMembershipResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static TopicMembershipResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<TopicMembershipResult>(create);
  static TopicMembershipResult? _defaultInstance;

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
  $async.Future<TopicMembershipResult> joinTopic(
          $pb.ClientContext? ctx, TopicMembershipRequest request) =>
      _client.invoke<TopicMembershipResult>(
          ctx, 'Realtime', 'JoinTopic', request, TopicMembershipResult());
  $async.Future<TopicMembershipResult> leaveTopic(
          $pb.ClientContext? ctx, TopicMembershipRequest request) =>
      _client.invoke<TopicMembershipResult>(
          ctx, 'Realtime', 'LeaveTopic', request, TopicMembershipResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
