// This is a generated file - do not edit.
//
// Generated from scribe/protocol/manifest.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class RateLimiter extends $pb.GeneratedMessage {
  factory RateLimiter({
    $core.int? limit,
    $0.Time? window,
    $0.Time? penalty,
    $0.Time? maxPenalty,
  }) {
    final result = create();
    if (limit != null) result.limit = limit;
    if (window != null) result.window = window;
    if (penalty != null) result.penalty = penalty;
    if (maxPenalty != null) result.maxPenalty = maxPenalty;
    return result;
  }

  RateLimiter._();

  factory RateLimiter.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RateLimiter.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RateLimiter',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'limit', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Time>(2, _omitFieldNames ? '' : 'window',
        subBuilder: $0.Time.create)
    ..aOM<$0.Time>(3, _omitFieldNames ? '' : 'penalty',
        subBuilder: $0.Time.create)
    ..aOM<$0.Time>(4, _omitFieldNames ? '' : 'maxPenalty',
        subBuilder: $0.Time.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RateLimiter clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RateLimiter copyWith(void Function(RateLimiter) updates) =>
      super.copyWith((message) => updates(message as RateLimiter))
          as RateLimiter;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RateLimiter create() => RateLimiter._();
  @$core.override
  RateLimiter createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RateLimiter getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RateLimiter>(create);
  static RateLimiter? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get limit => $_getIZ(0);
  @$pb.TagNumber(1)
  set limit($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasLimit() => $_has(0);
  @$pb.TagNumber(1)
  void clearLimit() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Time get window => $_getN(1);
  @$pb.TagNumber(2)
  set window($0.Time value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasWindow() => $_has(1);
  @$pb.TagNumber(2)
  void clearWindow() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Time ensureWindow() => $_ensure(1);

  @$pb.TagNumber(3)
  $0.Time get penalty => $_getN(2);
  @$pb.TagNumber(3)
  set penalty($0.Time value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasPenalty() => $_has(2);
  @$pb.TagNumber(3)
  void clearPenalty() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Time ensurePenalty() => $_ensure(2);

  @$pb.TagNumber(4)
  $0.Time get maxPenalty => $_getN(3);
  @$pb.TagNumber(4)
  set maxPenalty($0.Time value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasMaxPenalty() => $_has(3);
  @$pb.TagNumber(4)
  void clearMaxPenalty() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Time ensureMaxPenalty() => $_ensure(3);
}

class Route extends $pb.GeneratedMessage {
  factory Route({
    $core.String? routeId,
    $0.Method? method,
    $core.String? path,
    $core.Iterable<$0.Caller>? access,
    RateLimiter? rateLimit,
    $core.Iterable<$0.Need>? needs,
    $core.bool? webhookVerified,
    $core.String? rateLimitKey,
    $core.Iterable<$core.String>? requiredPermissions,
    $core.String? node,
  }) {
    final result = create();
    if (routeId != null) result.routeId = routeId;
    if (method != null) result.method = method;
    if (path != null) result.path = path;
    if (access != null) result.access.addAll(access);
    if (rateLimit != null) result.rateLimit = rateLimit;
    if (needs != null) result.needs.addAll(needs);
    if (webhookVerified != null) result.webhookVerified = webhookVerified;
    if (rateLimitKey != null) result.rateLimitKey = rateLimitKey;
    if (requiredPermissions != null)
      result.requiredPermissions.addAll(requiredPermissions);
    if (node != null) result.node = node;
    return result;
  }

  Route._();

  factory Route.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Route.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Route',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'routeId')
    ..aE<$0.Method>(2, _omitFieldNames ? '' : 'method',
        enumValues: $0.Method.values)
    ..aOS(3, _omitFieldNames ? '' : 'path')
    ..pc<$0.Caller>(5, _omitFieldNames ? '' : 'access', $pb.PbFieldType.KE,
        valueOf: $0.Caller.valueOf,
        enumValues: $0.Caller.values,
        defaultEnumValue: $0.Caller.CALLER_UNSPECIFIED)
    ..aOM<RateLimiter>(6, _omitFieldNames ? '' : 'rateLimit',
        subBuilder: RateLimiter.create)
    ..pc<$0.Need>(7, _omitFieldNames ? '' : 'needs', $pb.PbFieldType.KE,
        valueOf: $0.Need.valueOf,
        enumValues: $0.Need.values,
        defaultEnumValue: $0.Need.NEED_UNSPECIFIED)
    ..aOB(8, _omitFieldNames ? '' : 'webhookVerified')
    ..aOS(9, _omitFieldNames ? '' : 'rateLimitKey')
    ..pPS(10, _omitFieldNames ? '' : 'requiredPermissions')
    ..aOS(11, _omitFieldNames ? '' : 'node')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Route clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Route copyWith(void Function(Route) updates) =>
      super.copyWith((message) => updates(message as Route)) as Route;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Route create() => Route._();
  @$core.override
  Route createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Route getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Route>(create);
  static Route? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get routeId => $_getSZ(0);
  @$pb.TagNumber(1)
  set routeId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasRouteId() => $_has(0);
  @$pb.TagNumber(1)
  void clearRouteId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Method get method => $_getN(1);
  @$pb.TagNumber(2)
  set method($0.Method value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasMethod() => $_has(1);
  @$pb.TagNumber(2)
  void clearMethod() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get path => $_getSZ(2);
  @$pb.TagNumber(3)
  set path($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasPath() => $_has(2);
  @$pb.TagNumber(3)
  void clearPath() => $_clearField(3);

  @$pb.TagNumber(5)
  $pb.PbList<$0.Caller> get access => $_getList(3);

  @$pb.TagNumber(6)
  RateLimiter get rateLimit => $_getN(4);
  @$pb.TagNumber(6)
  set rateLimit(RateLimiter value) => $_setField(6, value);
  @$pb.TagNumber(6)
  $core.bool hasRateLimit() => $_has(4);
  @$pb.TagNumber(6)
  void clearRateLimit() => $_clearField(6);
  @$pb.TagNumber(6)
  RateLimiter ensureRateLimit() => $_ensure(4);

  @$pb.TagNumber(7)
  $pb.PbList<$0.Need> get needs => $_getList(5);

  @$pb.TagNumber(8)
  $core.bool get webhookVerified => $_getBF(6);
  @$pb.TagNumber(8)
  set webhookVerified($core.bool value) => $_setBool(6, value);
  @$pb.TagNumber(8)
  $core.bool hasWebhookVerified() => $_has(6);
  @$pb.TagNumber(8)
  void clearWebhookVerified() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.String get rateLimitKey => $_getSZ(7);
  @$pb.TagNumber(9)
  set rateLimitKey($core.String value) => $_setString(7, value);
  @$pb.TagNumber(9)
  $core.bool hasRateLimitKey() => $_has(7);
  @$pb.TagNumber(9)
  void clearRateLimitKey() => $_clearField(9);

  @$pb.TagNumber(10)
  $pb.PbList<$core.String> get requiredPermissions => $_getList(8);

  @$pb.TagNumber(11)
  $core.String get node => $_getSZ(9);
  @$pb.TagNumber(11)
  set node($core.String value) => $_setString(9, value);
  @$pb.TagNumber(11)
  $core.bool hasNode() => $_has(9);
  @$pb.TagNumber(11)
  void clearNode() => $_clearField(11);
}

class NodeDeclaration extends $pb.GeneratedMessage {
  factory NodeDeclaration({
    $core.String? name,
    $core.bool? public,
    $core.bool? logSink,
  }) {
    final result = create();
    if (name != null) result.name = name;
    if (public != null) result.public = public;
    if (logSink != null) result.logSink = logSink;
    return result;
  }

  NodeDeclaration._();

  factory NodeDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory NodeDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'NodeDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'name')
    ..aOB(2, _omitFieldNames ? '' : 'public')
    ..aOB(3, _omitFieldNames ? '' : 'logSink')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  NodeDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  NodeDeclaration copyWith(void Function(NodeDeclaration) updates) =>
      super.copyWith((message) => updates(message as NodeDeclaration))
          as NodeDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static NodeDeclaration create() => NodeDeclaration._();
  @$core.override
  NodeDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static NodeDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<NodeDeclaration>(create);
  static NodeDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get name => $_getSZ(0);
  @$pb.TagNumber(1)
  set name($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasName() => $_has(0);
  @$pb.TagNumber(1)
  void clearName() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.bool get public => $_getBF(1);
  @$pb.TagNumber(2)
  set public($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasPublic() => $_has(1);
  @$pb.TagNumber(2)
  void clearPublic() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.bool get logSink => $_getBF(2);
  @$pb.TagNumber(3)
  set logSink($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasLogSink() => $_has(2);
  @$pb.TagNumber(3)
  void clearLogSink() => $_clearField(3);
}

class HookDeclaration extends $pb.GeneratedMessage {
  factory HookDeclaration({
    $core.String? hookId,
    $core.String? event,
    $core.int? priority,
  }) {
    final result = create();
    if (hookId != null) result.hookId = hookId;
    if (event != null) result.event = event;
    if (priority != null) result.priority = priority;
    return result;
  }

  HookDeclaration._();

  factory HookDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory HookDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'HookDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'hookId')
    ..aOS(2, _omitFieldNames ? '' : 'event')
    ..aI(3, _omitFieldNames ? '' : 'priority', fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HookDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HookDeclaration copyWith(void Function(HookDeclaration) updates) =>
      super.copyWith((message) => updates(message as HookDeclaration))
          as HookDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static HookDeclaration create() => HookDeclaration._();
  @$core.override
  HookDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static HookDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<HookDeclaration>(create);
  static HookDeclaration? _defaultInstance;

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
  $core.int get priority => $_getIZ(2);
  @$pb.TagNumber(3)
  set priority($core.int value) => $_setUnsignedInt32(2, value);
  @$pb.TagNumber(3)
  $core.bool hasPriority() => $_has(2);
  @$pb.TagNumber(3)
  void clearPriority() => $_clearField(3);
}

class QueueDeclaration extends $pb.GeneratedMessage {
  factory QueueDeclaration({
    $core.String? queueId,
    $core.String? name,
    $core.int? batchSize,
    $0.Time? visibilityTimeout,
    $core.int? maxAttempts,
  }) {
    final result = create();
    if (queueId != null) result.queueId = queueId;
    if (name != null) result.name = name;
    if (batchSize != null) result.batchSize = batchSize;
    if (visibilityTimeout != null) result.visibilityTimeout = visibilityTimeout;
    if (maxAttempts != null) result.maxAttempts = maxAttempts;
    return result;
  }

  QueueDeclaration._();

  factory QueueDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory QueueDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'QueueDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'queueId')
    ..aOS(2, _omitFieldNames ? '' : 'name')
    ..aI(3, _omitFieldNames ? '' : 'batchSize', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Time>(4, _omitFieldNames ? '' : 'visibilityTimeout',
        subBuilder: $0.Time.create)
    ..aI(5, _omitFieldNames ? '' : 'maxAttempts',
        fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QueueDeclaration copyWith(void Function(QueueDeclaration) updates) =>
      super.copyWith((message) => updates(message as QueueDeclaration))
          as QueueDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static QueueDeclaration create() => QueueDeclaration._();
  @$core.override
  QueueDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static QueueDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<QueueDeclaration>(create);
  static QueueDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get queueId => $_getSZ(0);
  @$pb.TagNumber(1)
  set queueId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQueueId() => $_has(0);
  @$pb.TagNumber(1)
  void clearQueueId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get name => $_getSZ(1);
  @$pb.TagNumber(2)
  set name($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasName() => $_has(1);
  @$pb.TagNumber(2)
  void clearName() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.int get batchSize => $_getIZ(2);
  @$pb.TagNumber(3)
  set batchSize($core.int value) => $_setUnsignedInt32(2, value);
  @$pb.TagNumber(3)
  $core.bool hasBatchSize() => $_has(2);
  @$pb.TagNumber(3)
  void clearBatchSize() => $_clearField(3);

  @$pb.TagNumber(4)
  $0.Time get visibilityTimeout => $_getN(3);
  @$pb.TagNumber(4)
  set visibilityTimeout($0.Time value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasVisibilityTimeout() => $_has(3);
  @$pb.TagNumber(4)
  void clearVisibilityTimeout() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Time ensureVisibilityTimeout() => $_ensure(3);

  @$pb.TagNumber(5)
  $core.int get maxAttempts => $_getIZ(4);
  @$pb.TagNumber(5)
  set maxAttempts($core.int value) => $_setUnsignedInt32(4, value);
  @$pb.TagNumber(5)
  $core.bool hasMaxAttempts() => $_has(4);
  @$pb.TagNumber(5)
  void clearMaxAttempts() => $_clearField(5);
}

class CronDeclaration extends $pb.GeneratedMessage {
  factory CronDeclaration({
    $core.String? cronId,
    $core.String? name,
    $core.String? schedule,
  }) {
    final result = create();
    if (cronId != null) result.cronId = cronId;
    if (name != null) result.name = name;
    if (schedule != null) result.schedule = schedule;
    return result;
  }

  CronDeclaration._();

  factory CronDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory CronDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'CronDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'cronId')
    ..aOS(2, _omitFieldNames ? '' : 'name')
    ..aOS(3, _omitFieldNames ? '' : 'schedule')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CronDeclaration copyWith(void Function(CronDeclaration) updates) =>
      super.copyWith((message) => updates(message as CronDeclaration))
          as CronDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static CronDeclaration create() => CronDeclaration._();
  @$core.override
  CronDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static CronDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<CronDeclaration>(create);
  static CronDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get cronId => $_getSZ(0);
  @$pb.TagNumber(1)
  set cronId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasCronId() => $_has(0);
  @$pb.TagNumber(1)
  void clearCronId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get name => $_getSZ(1);
  @$pb.TagNumber(2)
  set name($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasName() => $_has(1);
  @$pb.TagNumber(2)
  void clearName() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get schedule => $_getSZ(2);
  @$pb.TagNumber(3)
  set schedule($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasSchedule() => $_has(2);
  @$pb.TagNumber(3)
  void clearSchedule() => $_clearField(3);
}

class SearcherDeclaration extends $pb.GeneratedMessage {
  factory SearcherDeclaration({
    $core.String? entity,
    $core.String? index,
    $0.Json? mappings,
    $0.Json? settings,
  }) {
    final result = create();
    if (entity != null) result.entity = entity;
    if (index != null) result.index = index;
    if (mappings != null) result.mappings = mappings;
    if (settings != null) result.settings = settings;
    return result;
  }

  SearcherDeclaration._();

  factory SearcherDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SearcherDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SearcherDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'entity')
    ..aOS(2, _omitFieldNames ? '' : 'index')
    ..aOM<$0.Json>(3, _omitFieldNames ? '' : 'mappings',
        subBuilder: $0.Json.create)
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'settings',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearcherDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SearcherDeclaration copyWith(void Function(SearcherDeclaration) updates) =>
      super.copyWith((message) => updates(message as SearcherDeclaration))
          as SearcherDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SearcherDeclaration create() => SearcherDeclaration._();
  @$core.override
  SearcherDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SearcherDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SearcherDeclaration>(create);
  static SearcherDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get entity => $_getSZ(0);
  @$pb.TagNumber(1)
  set entity($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasEntity() => $_has(0);
  @$pb.TagNumber(1)
  void clearEntity() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get index => $_getSZ(1);
  @$pb.TagNumber(2)
  set index($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasIndex() => $_has(1);
  @$pb.TagNumber(2)
  void clearIndex() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Json get mappings => $_getN(2);
  @$pb.TagNumber(3)
  set mappings($0.Json value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasMappings() => $_has(2);
  @$pb.TagNumber(3)
  void clearMappings() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Json ensureMappings() => $_ensure(2);

  @$pb.TagNumber(4)
  $0.Json get settings => $_getN(3);
  @$pb.TagNumber(4)
  set settings($0.Json value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasSettings() => $_has(3);
  @$pb.TagNumber(4)
  void clearSettings() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Json ensureSettings() => $_ensure(3);
}

class RealtimeDeclaration extends $pb.GeneratedMessage {
  factory RealtimeDeclaration({
    $core.String? channel,
    $core.Iterable<$core.String>? actions,
    $core.String? listen,
  }) {
    final result = create();
    if (channel != null) result.channel = channel;
    if (actions != null) result.actions.addAll(actions);
    if (listen != null) result.listen = listen;
    return result;
  }

  RealtimeDeclaration._();

  factory RealtimeDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RealtimeDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RealtimeDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'channel')
    ..pPS(2, _omitFieldNames ? '' : 'actions')
    ..aOS(3, _omitFieldNames ? '' : 'listen')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RealtimeDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RealtimeDeclaration copyWith(void Function(RealtimeDeclaration) updates) =>
      super.copyWith((message) => updates(message as RealtimeDeclaration))
          as RealtimeDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RealtimeDeclaration create() => RealtimeDeclaration._();
  @$core.override
  RealtimeDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RealtimeDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RealtimeDeclaration>(create);
  static RealtimeDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get channel => $_getSZ(0);
  @$pb.TagNumber(1)
  set channel($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasChannel() => $_has(0);
  @$pb.TagNumber(1)
  void clearChannel() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get actions => $_getList(1);

  @$pb.TagNumber(3)
  $core.String get listen => $_getSZ(2);
  @$pb.TagNumber(3)
  set listen($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasListen() => $_has(2);
  @$pb.TagNumber(3)
  void clearListen() => $_clearField(3);
}

class StorageDeclaration extends $pb.GeneratedMessage {
  factory StorageDeclaration({
    $core.String? folder,
    $core.String? pathTemplate,
    $0.Size? maxSize,
    $core.Iterable<$core.String>? mimeTypes,
  }) {
    final result = create();
    if (folder != null) result.folder = folder;
    if (pathTemplate != null) result.pathTemplate = pathTemplate;
    if (maxSize != null) result.maxSize = maxSize;
    if (mimeTypes != null) result.mimeTypes.addAll(mimeTypes);
    return result;
  }

  StorageDeclaration._();

  factory StorageDeclaration.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory StorageDeclaration.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'StorageDeclaration',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'folder')
    ..aOS(2, _omitFieldNames ? '' : 'pathTemplate')
    ..aOM<$0.Size>(3, _omitFieldNames ? '' : 'maxSize',
        subBuilder: $0.Size.create)
    ..pPS(4, _omitFieldNames ? '' : 'mimeTypes')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  StorageDeclaration clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  StorageDeclaration copyWith(void Function(StorageDeclaration) updates) =>
      super.copyWith((message) => updates(message as StorageDeclaration))
          as StorageDeclaration;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static StorageDeclaration create() => StorageDeclaration._();
  @$core.override
  StorageDeclaration createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static StorageDeclaration getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<StorageDeclaration>(create);
  static StorageDeclaration? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get folder => $_getSZ(0);
  @$pb.TagNumber(1)
  set folder($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasFolder() => $_has(0);
  @$pb.TagNumber(1)
  void clearFolder() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get pathTemplate => $_getSZ(1);
  @$pb.TagNumber(2)
  set pathTemplate($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasPathTemplate() => $_has(1);
  @$pb.TagNumber(2)
  void clearPathTemplate() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Size get maxSize => $_getN(2);
  @$pb.TagNumber(3)
  set maxSize($0.Size value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasMaxSize() => $_has(2);
  @$pb.TagNumber(3)
  void clearMaxSize() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Size ensureMaxSize() => $_ensure(2);

  @$pb.TagNumber(4)
  $pb.PbList<$core.String> get mimeTypes => $_getList(3);
}

class Manifest extends $pb.GeneratedMessage {
  factory Manifest({
    $core.String? protocolVersion,
    $core.String? workerLanguage,
    $core.Iterable<Route>? routes,
    $core.Iterable<HookDeclaration>? hooks,
    $core.Iterable<QueueDeclaration>? queues,
    $core.Iterable<CronDeclaration>? crons,
    $core.Iterable<SearcherDeclaration>? searchers,
    $core.Iterable<RealtimeDeclaration>? realtimes,
    $core.Iterable<StorageDeclaration>? storages,
    $core.String? sdkVersion,
    $core.Iterable<NodeDeclaration>? nodes,
    $core.bool? rootLogSink,
  }) {
    final result = create();
    if (protocolVersion != null) result.protocolVersion = protocolVersion;
    if (workerLanguage != null) result.workerLanguage = workerLanguage;
    if (routes != null) result.routes.addAll(routes);
    if (hooks != null) result.hooks.addAll(hooks);
    if (queues != null) result.queues.addAll(queues);
    if (crons != null) result.crons.addAll(crons);
    if (searchers != null) result.searchers.addAll(searchers);
    if (realtimes != null) result.realtimes.addAll(realtimes);
    if (storages != null) result.storages.addAll(storages);
    if (sdkVersion != null) result.sdkVersion = sdkVersion;
    if (nodes != null) result.nodes.addAll(nodes);
    if (rootLogSink != null) result.rootLogSink = rootLogSink;
    return result;
  }

  Manifest._();

  factory Manifest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Manifest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Manifest',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'protocolVersion')
    ..aOS(2, _omitFieldNames ? '' : 'workerLanguage')
    ..pPM<Route>(3, _omitFieldNames ? '' : 'routes', subBuilder: Route.create)
    ..pPM<HookDeclaration>(4, _omitFieldNames ? '' : 'hooks',
        subBuilder: HookDeclaration.create)
    ..pPM<QueueDeclaration>(5, _omitFieldNames ? '' : 'queues',
        subBuilder: QueueDeclaration.create)
    ..pPM<CronDeclaration>(6, _omitFieldNames ? '' : 'crons',
        subBuilder: CronDeclaration.create)
    ..pPM<SearcherDeclaration>(7, _omitFieldNames ? '' : 'searchers',
        subBuilder: SearcherDeclaration.create)
    ..pPM<RealtimeDeclaration>(8, _omitFieldNames ? '' : 'realtimes',
        subBuilder: RealtimeDeclaration.create)
    ..pPM<StorageDeclaration>(9, _omitFieldNames ? '' : 'storages',
        subBuilder: StorageDeclaration.create)
    ..aOS(10, _omitFieldNames ? '' : 'sdkVersion')
    ..pPM<NodeDeclaration>(11, _omitFieldNames ? '' : 'nodes',
        subBuilder: NodeDeclaration.create)
    ..aOB(12, _omitFieldNames ? '' : 'rootLogSink')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Manifest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Manifest copyWith(void Function(Manifest) updates) =>
      super.copyWith((message) => updates(message as Manifest)) as Manifest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Manifest create() => Manifest._();
  @$core.override
  Manifest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Manifest getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Manifest>(create);
  static Manifest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get protocolVersion => $_getSZ(0);
  @$pb.TagNumber(1)
  set protocolVersion($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasProtocolVersion() => $_has(0);
  @$pb.TagNumber(1)
  void clearProtocolVersion() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get workerLanguage => $_getSZ(1);
  @$pb.TagNumber(2)
  set workerLanguage($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasWorkerLanguage() => $_has(1);
  @$pb.TagNumber(2)
  void clearWorkerLanguage() => $_clearField(2);

  @$pb.TagNumber(3)
  $pb.PbList<Route> get routes => $_getList(2);

  @$pb.TagNumber(4)
  $pb.PbList<HookDeclaration> get hooks => $_getList(3);

  @$pb.TagNumber(5)
  $pb.PbList<QueueDeclaration> get queues => $_getList(4);

  @$pb.TagNumber(6)
  $pb.PbList<CronDeclaration> get crons => $_getList(5);

  @$pb.TagNumber(7)
  $pb.PbList<SearcherDeclaration> get searchers => $_getList(6);

  @$pb.TagNumber(8)
  $pb.PbList<RealtimeDeclaration> get realtimes => $_getList(7);

  @$pb.TagNumber(9)
  $pb.PbList<StorageDeclaration> get storages => $_getList(8);

  @$pb.TagNumber(10)
  $core.String get sdkVersion => $_getSZ(9);
  @$pb.TagNumber(10)
  set sdkVersion($core.String value) => $_setString(9, value);
  @$pb.TagNumber(10)
  $core.bool hasSdkVersion() => $_has(9);
  @$pb.TagNumber(10)
  void clearSdkVersion() => $_clearField(10);

  @$pb.TagNumber(11)
  $pb.PbList<NodeDeclaration> get nodes => $_getList(10);

  @$pb.TagNumber(12)
  $core.bool get rootLogSink => $_getBF(11);
  @$pb.TagNumber(12)
  set rootLogSink($core.bool value) => $_setBool(11, value);
  @$pb.TagNumber(12)
  $core.bool hasRootLogSink() => $_has(11);
  @$pb.TagNumber(12)
  void clearRootLogSink() => $_clearField(12);
}

class HandshakeRequest extends $pb.GeneratedMessage {
  factory HandshakeRequest({
    $core.String? hostProtocolVersion,
    $core.String? hostEndpoint,
    $core.String? capabilityToken,
  }) {
    final result = create();
    if (hostProtocolVersion != null)
      result.hostProtocolVersion = hostProtocolVersion;
    if (hostEndpoint != null) result.hostEndpoint = hostEndpoint;
    if (capabilityToken != null) result.capabilityToken = capabilityToken;
    return result;
  }

  HandshakeRequest._();

  factory HandshakeRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory HandshakeRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'HandshakeRequest',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'hostProtocolVersion')
    ..aOS(2, _omitFieldNames ? '' : 'hostEndpoint')
    ..aOS(3, _omitFieldNames ? '' : 'capabilityToken')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HandshakeRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  HandshakeRequest copyWith(void Function(HandshakeRequest) updates) =>
      super.copyWith((message) => updates(message as HandshakeRequest))
          as HandshakeRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static HandshakeRequest create() => HandshakeRequest._();
  @$core.override
  HandshakeRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static HandshakeRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<HandshakeRequest>(create);
  static HandshakeRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get hostProtocolVersion => $_getSZ(0);
  @$pb.TagNumber(1)
  set hostProtocolVersion($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasHostProtocolVersion() => $_has(0);
  @$pb.TagNumber(1)
  void clearHostProtocolVersion() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get hostEndpoint => $_getSZ(1);
  @$pb.TagNumber(2)
  set hostEndpoint($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasHostEndpoint() => $_has(1);
  @$pb.TagNumber(2)
  void clearHostEndpoint() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get capabilityToken => $_getSZ(2);
  @$pb.TagNumber(3)
  set capabilityToken($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasCapabilityToken() => $_has(2);
  @$pb.TagNumber(3)
  void clearCapabilityToken() => $_clearField(3);
}

class RegistrationApi {
  final $pb.RpcClient _client;

  RegistrationApi(this._client);

  $async.Future<Manifest> describe(
          $pb.ClientContext? ctx, HandshakeRequest request) =>
      _client.invoke<Manifest>(
          ctx, 'Registration', 'Describe', request, Manifest());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
