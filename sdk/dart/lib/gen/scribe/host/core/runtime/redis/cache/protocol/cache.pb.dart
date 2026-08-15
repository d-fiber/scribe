// This is a generated file - do not edit.
//
// Generated from scribe/host/core/runtime/redis/cache/protocol/cache.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class CacheKey extends $pb.GeneratedMessage {
  factory CacheKey({
    $core.String? namespace,
    $core.String? key,
  }) {
    final result = create();
    if (namespace != null) result.namespace = namespace;
    if (key != null) result.key = key;
    return result;
  }

  CacheKey._();

  factory CacheKey.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory CacheKey.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'CacheKey',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'namespace')
    ..aOS(2, _omitFieldNames ? '' : 'key')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CacheKey clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CacheKey copyWith(void Function(CacheKey) updates) =>
      super.copyWith((message) => updates(message as CacheKey)) as CacheKey;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static CacheKey create() => CacheKey._();
  @$core.override
  CacheKey createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static CacheKey getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<CacheKey>(create);
  static CacheKey? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get namespace => $_getSZ(0);
  @$pb.TagNumber(1)
  set namespace($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasNamespace() => $_has(0);
  @$pb.TagNumber(1)
  void clearNamespace() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get key => $_getSZ(1);
  @$pb.TagNumber(2)
  set key($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasKey() => $_has(1);
  @$pb.TagNumber(2)
  void clearKey() => $_clearField(2);
}

class GetRequest extends $pb.GeneratedMessage {
  factory GetRequest({
    CacheKey? key,
  }) {
    final result = create();
    if (key != null) result.key = key;
    return result;
  }

  GetRequest._();

  factory GetRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GetRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GetRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOM<CacheKey>(1, _omitFieldNames ? '' : 'key',
        subBuilder: CacheKey.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GetRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GetRequest copyWith(void Function(GetRequest) updates) =>
      super.copyWith((message) => updates(message as GetRequest)) as GetRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GetRequest create() => GetRequest._();
  @$core.override
  GetRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GetRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GetRequest>(create);
  static GetRequest? _defaultInstance;

  @$pb.TagNumber(1)
  CacheKey get key => $_getN(0);
  @$pb.TagNumber(1)
  set key(CacheKey value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasKey() => $_has(0);
  @$pb.TagNumber(1)
  void clearKey() => $_clearField(1);
  @$pb.TagNumber(1)
  CacheKey ensureKey() => $_ensure(0);
}

class GetResult extends $pb.GeneratedMessage {
  factory GetResult({
    $core.bool? hit,
    $0.Json? value,
    $0.Failure? error,
  }) {
    final result = create();
    if (hit != null) result.hit = hit;
    if (value != null) result.value = value;
    if (error != null) result.error = error;
    return result;
  }

  GetResult._();

  factory GetResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GetResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GetResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'hit')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'value',
        subBuilder: $0.Json.create)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GetResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GetResult copyWith(void Function(GetResult) updates) =>
      super.copyWith((message) => updates(message as GetResult)) as GetResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GetResult create() => GetResult._();
  @$core.override
  GetResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GetResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<GetResult>(create);
  static GetResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get hit => $_getBF(0);
  @$pb.TagNumber(1)
  set hit($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasHit() => $_has(0);
  @$pb.TagNumber(1)
  void clearHit() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get value => $_getN(1);
  @$pb.TagNumber(2)
  set value($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasValue() => $_has(1);
  @$pb.TagNumber(2)
  void clearValue() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureValue() => $_ensure(1);

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

class SetRequest extends $pb.GeneratedMessage {
  factory SetRequest({
    CacheKey? key,
    $0.Json? value,
    $0.Time? ttl,
  }) {
    final result = create();
    if (key != null) result.key = key;
    if (value != null) result.value = value;
    if (ttl != null) result.ttl = ttl;
    return result;
  }

  SetRequest._();

  factory SetRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SetRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SetRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOM<CacheKey>(1, _omitFieldNames ? '' : 'key',
        subBuilder: CacheKey.create)
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'value',
        subBuilder: $0.Json.create)
    ..aOM<$0.Time>(3, _omitFieldNames ? '' : 'ttl', subBuilder: $0.Time.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SetRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SetRequest copyWith(void Function(SetRequest) updates) =>
      super.copyWith((message) => updates(message as SetRequest)) as SetRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SetRequest create() => SetRequest._();
  @$core.override
  SetRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SetRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SetRequest>(create);
  static SetRequest? _defaultInstance;

  @$pb.TagNumber(1)
  CacheKey get key => $_getN(0);
  @$pb.TagNumber(1)
  set key(CacheKey value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasKey() => $_has(0);
  @$pb.TagNumber(1)
  void clearKey() => $_clearField(1);
  @$pb.TagNumber(1)
  CacheKey ensureKey() => $_ensure(0);

  @$pb.TagNumber(2)
  $0.Json get value => $_getN(1);
  @$pb.TagNumber(2)
  set value($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasValue() => $_has(1);
  @$pb.TagNumber(2)
  void clearValue() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureValue() => $_ensure(1);

  @$pb.TagNumber(3)
  $0.Time get ttl => $_getN(2);
  @$pb.TagNumber(3)
  set ttl($0.Time value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasTtl() => $_has(2);
  @$pb.TagNumber(3)
  void clearTtl() => $_clearField(3);
  @$pb.TagNumber(3)
  $0.Time ensureTtl() => $_ensure(2);
}

class SetResult extends $pb.GeneratedMessage {
  factory SetResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  SetResult._();

  factory SetResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SetResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SetResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SetResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SetResult copyWith(void Function(SetResult) updates) =>
      super.copyWith((message) => updates(message as SetResult)) as SetResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SetResult create() => SetResult._();
  @$core.override
  SetResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SetResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<SetResult>(create);
  static SetResult? _defaultInstance;

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

class DeleteRequest extends $pb.GeneratedMessage {
  factory DeleteRequest({
    CacheKey? key,
    $core.bool? prefix,
  }) {
    final result = create();
    if (key != null) result.key = key;
    if (prefix != null) result.prefix = prefix;
    return result;
  }

  DeleteRequest._();

  factory DeleteRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aOM<CacheKey>(1, _omitFieldNames ? '' : 'key',
        subBuilder: CacheKey.create)
    ..aOB(2, _omitFieldNames ? '' : 'prefix')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteRequest copyWith(void Function(DeleteRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteRequest))
          as DeleteRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteRequest create() => DeleteRequest._();
  @$core.override
  DeleteRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteRequest>(create);
  static DeleteRequest? _defaultInstance;

  @$pb.TagNumber(1)
  CacheKey get key => $_getN(0);
  @$pb.TagNumber(1)
  set key(CacheKey value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasKey() => $_has(0);
  @$pb.TagNumber(1)
  void clearKey() => $_clearField(1);
  @$pb.TagNumber(1)
  CacheKey ensureKey() => $_ensure(0);

  @$pb.TagNumber(2)
  $core.bool get prefix => $_getBF(1);
  @$pb.TagNumber(2)
  set prefix($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasPrefix() => $_has(1);
  @$pb.TagNumber(2)
  void clearPrefix() => $_clearField(2);
}

class DeleteResult extends $pb.GeneratedMessage {
  factory DeleteResult({
    $core.int? deleted,
    $0.Failure? error,
  }) {
    final result = create();
    if (deleted != null) result.deleted = deleted;
    if (error != null) result.error = error;
    return result;
  }

  DeleteResult._();

  factory DeleteResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.runtime.cache.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'deleted', fieldType: $pb.PbFieldType.OU3)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteResult copyWith(void Function(DeleteResult) updates) =>
      super.copyWith((message) => updates(message as DeleteResult))
          as DeleteResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteResult create() => DeleteResult._();
  @$core.override
  DeleteResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteResult>(create);
  static DeleteResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get deleted => $_getIZ(0);
  @$pb.TagNumber(1)
  set deleted($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasDeleted() => $_has(0);
  @$pb.TagNumber(1)
  void clearDeleted() => $_clearField(1);

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

class CacheApi {
  final $pb.RpcClient _client;

  CacheApi(this._client);

  $async.Future<GetResult> get($pb.ClientContext? ctx, GetRequest request) =>
      _client.invoke<GetResult>(ctx, 'Cache', 'Get', request, GetResult());
  $async.Future<SetResult> set($pb.ClientContext? ctx, SetRequest request) =>
      _client.invoke<SetResult>(ctx, 'Cache', 'Set', request, SetResult());
  $async.Future<DeleteResult> delete(
          $pb.ClientContext? ctx, DeleteRequest request) =>
      _client.invoke<DeleteResult>(
          ctx, 'Cache', 'Delete', request, DeleteResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
