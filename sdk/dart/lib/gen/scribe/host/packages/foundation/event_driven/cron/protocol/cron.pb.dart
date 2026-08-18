// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/event_driven/cron/protocol/cron.proto.

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

class CronTrigger extends $pb.GeneratedMessage {
  factory CronTrigger({
    $core.String? cronId,
    $core.String? traceId,
    $fixnum.Int64? scheduledAt,
    $fixnum.Int64? firedAt,
    $core.String? capabilityToken,
  }) {
    final result = create();
    if (cronId != null) result.cronId = cronId;
    if (traceId != null) result.traceId = traceId;
    if (scheduledAt != null) result.scheduledAt = scheduledAt;
    if (firedAt != null) result.firedAt = firedAt;
    if (capabilityToken != null) result.capabilityToken = capabilityToken;
    return result;
  }

  CronTrigger._();

  factory CronTrigger.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory CronTrigger.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'CronTrigger',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cron.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'cronId')
    ..aOS(2, _omitFieldNames ? '' : 'traceId')
    ..aInt64(3, _omitFieldNames ? '' : 'scheduledAt')
    ..aInt64(4, _omitFieldNames ? '' : 'firedAt')
    ..aOS(5, _omitFieldNames ? '' : 'capabilityToken')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronTrigger clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronTrigger copyWith(void Function(CronTrigger) updates) =>
      super.copyWith((message) => updates(message as CronTrigger))
          as CronTrigger;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static CronTrigger create() => CronTrigger._();
  @$core.override
  CronTrigger createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static CronTrigger getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<CronTrigger>(create);
  static CronTrigger? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get cronId => $_getSZ(0);
  @$pb.TagNumber(1)
  set cronId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasCronId() => $_has(0);
  @$pb.TagNumber(1)
  void clearCronId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get traceId => $_getSZ(1);
  @$pb.TagNumber(2)
  set traceId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTraceId() => $_has(1);
  @$pb.TagNumber(2)
  void clearTraceId() => $_clearField(2);

  @$pb.TagNumber(3)
  $fixnum.Int64 get scheduledAt => $_getI64(2);
  @$pb.TagNumber(3)
  set scheduledAt($fixnum.Int64 value) => $_setInt64(2, value);
  @$pb.TagNumber(3)
  $core.bool hasScheduledAt() => $_has(2);
  @$pb.TagNumber(3)
  void clearScheduledAt() => $_clearField(3);

  @$pb.TagNumber(4)
  $fixnum.Int64 get firedAt => $_getI64(3);
  @$pb.TagNumber(4)
  set firedAt($fixnum.Int64 value) => $_setInt64(3, value);
  @$pb.TagNumber(4)
  $core.bool hasFiredAt() => $_has(3);
  @$pb.TagNumber(4)
  void clearFiredAt() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.String get capabilityToken => $_getSZ(4);
  @$pb.TagNumber(5)
  set capabilityToken($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasCapabilityToken() => $_has(4);
  @$pb.TagNumber(5)
  void clearCapabilityToken() => $_clearField(5);
}

class CronOutcome extends $pb.GeneratedMessage {
  factory CronOutcome({
    $core.bool? completed,
    $0.Failure? error,
  }) {
    final result = create();
    if (completed != null) result.completed = completed;
    if (error != null) result.error = error;
    return result;
  }

  CronOutcome._();

  factory CronOutcome.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory CronOutcome.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'CronOutcome',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cron.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'completed')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronOutcome clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronOutcome copyWith(void Function(CronOutcome) updates) =>
      super.copyWith((message) => updates(message as CronOutcome))
          as CronOutcome;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static CronOutcome create() => CronOutcome._();
  @$core.override
  CronOutcome createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static CronOutcome getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<CronOutcome>(create);
  static CronOutcome? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get completed => $_getBF(0);
  @$pb.TagNumber(1)
  set completed($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasCompleted() => $_has(0);
  @$pb.TagNumber(1)
  void clearCompleted() => $_clearField(1);

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

class CronDispatchApi {
  final $pb.RpcClient _client;

  CronDispatchApi(this._client);

  $async.Future<CronOutcome> trigger(
          $pb.ClientContext? ctx, CronTrigger request) =>
      _client.invoke<CronOutcome>(
          ctx, 'CronDispatch', 'Trigger', request, CronOutcome());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
