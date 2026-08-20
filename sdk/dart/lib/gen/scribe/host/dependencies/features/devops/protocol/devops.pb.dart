// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/devops/protocol/devops.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class RemoteConfigRequest extends $pb.GeneratedMessage {
  factory RemoteConfigRequest({
    $core.String? key,
    $core.String? platform,
    $core.String? appVersion,
  }) {
    final result = create();
    if (key != null) result.key = key;
    if (platform != null) result.platform = platform;
    if (appVersion != null) result.appVersion = appVersion;
    return result;
  }

  RemoteConfigRequest._();

  factory RemoteConfigRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RemoteConfigRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RemoteConfigRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'key')
    ..aOS(2, _omitFieldNames ? '' : 'platform')
    ..aOS(3, _omitFieldNames ? '' : 'appVersion')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoteConfigRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoteConfigRequest copyWith(void Function(RemoteConfigRequest) updates) =>
      super.copyWith((message) => updates(message as RemoteConfigRequest))
          as RemoteConfigRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RemoteConfigRequest create() => RemoteConfigRequest._();
  @$core.override
  RemoteConfigRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RemoteConfigRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RemoteConfigRequest>(create);
  static RemoteConfigRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get key => $_getSZ(0);
  @$pb.TagNumber(1)
  set key($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasKey() => $_has(0);
  @$pb.TagNumber(1)
  void clearKey() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get platform => $_getSZ(1);
  @$pb.TagNumber(2)
  set platform($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasPlatform() => $_has(1);
  @$pb.TagNumber(2)
  void clearPlatform() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get appVersion => $_getSZ(2);
  @$pb.TagNumber(3)
  set appVersion($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasAppVersion() => $_has(2);
  @$pb.TagNumber(3)
  void clearAppVersion() => $_clearField(3);
}

class RemoteConfigResult extends $pb.GeneratedMessage {
  factory RemoteConfigResult({
    $0.Json? value,
    $0.Failure? error,
  }) {
    final result = create();
    if (value != null) result.value = value;
    if (error != null) result.error = error;
    return result;
  }

  RemoteConfigResult._();

  factory RemoteConfigResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RemoteConfigResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RemoteConfigResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Json>(1, _omitFieldNames ? '' : 'value',
        subBuilder: $0.Json.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoteConfigResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoteConfigResult copyWith(void Function(RemoteConfigResult) updates) =>
      super.copyWith((message) => updates(message as RemoteConfigResult))
          as RemoteConfigResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RemoteConfigResult create() => RemoteConfigResult._();
  @$core.override
  RemoteConfigResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RemoteConfigResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RemoteConfigResult>(create);
  static RemoteConfigResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Json get value => $_getN(0);
  @$pb.TagNumber(1)
  set value($0.Json value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasValue() => $_has(0);
  @$pb.TagNumber(1)
  void clearValue() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Json ensureValue() => $_ensure(0);

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

class RemoteConfigsApi {
  final $pb.RpcClient _client;

  RemoteConfigsApi(this._client);

  $async.Future<RemoteConfigResult> get(
          $pb.ClientContext? ctx, RemoteConfigRequest request) =>
      _client.invoke<RemoteConfigResult>(
          ctx, 'RemoteConfigs', 'Get', request, RemoteConfigResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
