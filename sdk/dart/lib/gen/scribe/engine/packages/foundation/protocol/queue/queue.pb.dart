// This is a generated file - do not edit.
//
// Generated from scribe/engine/packages/foundation/protocol/queue/queue.proto.

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

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Message extends $pb.GeneratedMessage {
  factory Message({
    $core.String? messageId,
    $0.Json? payload,
    $core.int? attempt,
    $fixnum.Int64? enqueuedAt,
  }) {
    final result = create();
    if (messageId != null) result.messageId = messageId;
    if (payload != null) result.payload = payload;
    if (attempt != null) result.attempt = attempt;
    if (enqueuedAt != null) result.enqueuedAt = enqueuedAt;
    return result;
  }

  Message._();

  factory Message.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Message.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Message',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'messageId')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'payload',
        subBuilder: $0.Json.create)
    ..aI(3, _omitFieldNames ? '' : 'attempt', fieldType: $pb.PbFieldType.OU3)
    ..aInt64(4, _omitFieldNames ? '' : 'enqueuedAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Message clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Message copyWith(void Function(Message) updates) =>
      super.copyWith((message) => updates(message as Message)) as Message;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Message create() => Message._();
  @$core.override
  Message createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Message getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Message>(create);
  static Message? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get messageId => $_getSZ(0);
  @$pb.TagNumber(1)
  set messageId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasMessageId() => $_has(0);
  @$pb.TagNumber(1)
  void clearMessageId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get payload => $_getN(1);
  @$pb.TagNumber(2)
  set payload($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasPayload() => $_has(1);
  @$pb.TagNumber(2)
  void clearPayload() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensurePayload() => $_ensure(1);

  @$pb.TagNumber(3)
  $core.int get attempt => $_getIZ(2);
  @$pb.TagNumber(3)
  set attempt($core.int value) => $_setUnsignedInt32(2, value);
  @$pb.TagNumber(3)
  $core.bool hasAttempt() => $_has(2);
  @$pb.TagNumber(3)
  void clearAttempt() => $_clearField(3);

  @$pb.TagNumber(4)
  $fixnum.Int64 get enqueuedAt => $_getI64(3);
  @$pb.TagNumber(4)
  set enqueuedAt($fixnum.Int64 value) => $_setInt64(3, value);
  @$pb.TagNumber(4)
  $core.bool hasEnqueuedAt() => $_has(3);
  @$pb.TagNumber(4)
  void clearEnqueuedAt() => $_clearField(4);
}

class PushRequest extends $pb.GeneratedMessage {
  factory PushRequest({
    $core.String? queueId,
    $core.Iterable<$0.Json>? payloads,
    $0.Time? delay,
  }) {
    final result = create();
    if (queueId != null) result.queueId = queueId;
    if (payloads != null) result.payloads.addAll(payloads);
    if (delay != null) result.delay = delay;
    return result;
  }

  PushRequest._();

  factory PushRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PushRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PushRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'queueId')
    ..pPM<$0.Json>(2, _omitFieldNames ? '' : 'payloads',
        subBuilder: $0.Json.create)
    ..aOM<$0.Time>(3, _omitFieldNames ? '' : 'delay',
        subBuilder: $0.Time.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushRequest copyWith(void Function(PushRequest) updates) =>
      super.copyWith((message) => updates(message as PushRequest))
          as PushRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PushRequest create() => PushRequest._();
  @$core.override
  PushRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PushRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PushRequest>(create);
  static PushRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get queueId => $_getSZ(0);
  @$pb.TagNumber(1)
  set queueId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQueueId() => $_has(0);
  @$pb.TagNumber(1)
  void clearQueueId() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$0.Json> get payloads => $_getList(1);

  @$pb.TagNumber(3)
  $0.Time get delay => $_getN(2);
  @$pb.TagNumber(3)
  set delay($0.Time value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasDelay() => $_has(2);
  @$pb.TagNumber(3)
  void clearDelay() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Time ensureDelay() => $_ensure(2);
}

class PushResult extends $pb.GeneratedMessage {
  factory PushResult({
    $core.Iterable<$core.String>? messageIds,
    $0.Failure? error,
  }) {
    final result = create();
    if (messageIds != null) result.messageIds.addAll(messageIds);
    if (error != null) result.error = error;
    return result;
  }

  PushResult._();

  factory PushResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PushResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PushResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..pPS(1, _omitFieldNames ? '' : 'messageIds')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PushResult copyWith(void Function(PushResult) updates) =>
      super.copyWith((message) => updates(message as PushResult)) as PushResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PushResult create() => PushResult._();
  @$core.override
  PushResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PushResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PushResult>(create);
  static PushResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<$core.String> get messageIds => $_getList(0);

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

class Batch extends $pb.GeneratedMessage {
  factory Batch({
    $core.String? queueId,
    $core.String? traceId,
    $core.Iterable<Message>? messages,
    $core.String? capabilityToken,
  }) {
    final result = create();
    if (queueId != null) result.queueId = queueId;
    if (traceId != null) result.traceId = traceId;
    if (messages != null) result.messages.addAll(messages);
    if (capabilityToken != null) result.capabilityToken = capabilityToken;
    return result;
  }

  Batch._();

  factory Batch.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Batch.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Batch',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'queueId')
    ..aOS(2, _omitFieldNames ? '' : 'traceId')
    ..pPM<Message>(3, _omitFieldNames ? '' : 'messages',
        subBuilder: Message.create)
    ..aOS(4, _omitFieldNames ? '' : 'capabilityToken')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Batch clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Batch copyWith(void Function(Batch) updates) =>
      super.copyWith((message) => updates(message as Batch)) as Batch;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Batch create() => Batch._();
  @$core.override
  Batch createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Batch getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Batch>(create);
  static Batch? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get queueId => $_getSZ(0);
  @$pb.TagNumber(1)
  set queueId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQueueId() => $_has(0);
  @$pb.TagNumber(1)
  void clearQueueId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get traceId => $_getSZ(1);
  @$pb.TagNumber(2)
  set traceId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTraceId() => $_has(1);
  @$pb.TagNumber(2)
  void clearTraceId() => $_clearField(2);

  @$pb.TagNumber(3)
  $pb.PbList<Message> get messages => $_getList(2);

  @$pb.TagNumber(4)
  $core.String get capabilityToken => $_getSZ(3);
  @$pb.TagNumber(4)
  set capabilityToken($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasCapabilityToken() => $_has(3);
  @$pb.TagNumber(4)
  void clearCapabilityToken() => $_clearField(4);
}

class MessageOutcome extends $pb.GeneratedMessage {
  factory MessageOutcome({
    $core.String? messageId,
    $core.bool? acknowledged,
    $0.Failure? error,
  }) {
    final result = create();
    if (messageId != null) result.messageId = messageId;
    if (acknowledged != null) result.acknowledged = acknowledged;
    if (error != null) result.error = error;
    return result;
  }

  MessageOutcome._();

  factory MessageOutcome.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory MessageOutcome.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'MessageOutcome',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'messageId')
    ..aOB(2, _omitFieldNames ? '' : 'acknowledged')
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MessageOutcome clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  MessageOutcome copyWith(void Function(MessageOutcome) updates) =>
      super.copyWith((message) => updates(message as MessageOutcome))
          as MessageOutcome;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static MessageOutcome create() => MessageOutcome._();
  @$core.override
  MessageOutcome createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static MessageOutcome getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<MessageOutcome>(create);
  static MessageOutcome? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get messageId => $_getSZ(0);
  @$pb.TagNumber(1)
  set messageId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasMessageId() => $_has(0);
  @$pb.TagNumber(1)
  void clearMessageId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.bool get acknowledged => $_getBF(1);
  @$pb.TagNumber(2)
  set acknowledged($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasAcknowledged() => $_has(1);
  @$pb.TagNumber(2)
  void clearAcknowledged() => $_clearField(2);

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

class BatchOutcome extends $pb.GeneratedMessage {
  factory BatchOutcome({
    $core.Iterable<MessageOutcome>? outcomes,
  }) {
    final result = create();
    if (outcomes != null) result.outcomes.addAll(outcomes);
    return result;
  }

  BatchOutcome._();

  factory BatchOutcome.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BatchOutcome.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BatchOutcome',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.queue.v1'),
      createEmptyInstance: create)
    ..pPM<MessageOutcome>(1, _omitFieldNames ? '' : 'outcomes',
        subBuilder: MessageOutcome.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BatchOutcome clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BatchOutcome copyWith(void Function(BatchOutcome) updates) =>
      super.copyWith((message) => updates(message as BatchOutcome))
          as BatchOutcome;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BatchOutcome create() => BatchOutcome._();
  @$core.override
  BatchOutcome createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BatchOutcome getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BatchOutcome>(create);
  static BatchOutcome? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<MessageOutcome> get outcomes => $_getList(0);
}

class QueueApi {
  final $pb.RpcClient _client;

  QueueApi(this._client);

  $async.Future<PushResult> push($pb.ClientContext? ctx, PushRequest request) =>
      _client.invoke<PushResult>(ctx, 'Queue', 'Push', request, PushResult());
}

class QueueDispatchApi {
  final $pb.RpcClient _client;

  QueueDispatchApi(this._client);

  $async.Future<BatchOutcome> handle($pb.ClientContext? ctx, Batch request) =>
      _client.invoke<BatchOutcome>(
          ctx, 'QueueDispatch', 'Handle', request, BatchOutcome());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
