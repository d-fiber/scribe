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

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class DynamicLink extends $pb.GeneratedMessage {
  factory DynamicLink({
    $core.String? id,
    $core.String? slug,
    $core.String? targetUrl,
    $0.Json? metadata,
    $fixnum.Int64? expiresAt,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (slug != null) result.slug = slug;
    if (targetUrl != null) result.targetUrl = targetUrl;
    if (metadata != null) result.metadata = metadata;
    if (expiresAt != null) result.expiresAt = expiresAt;
    return result;
  }

  DynamicLink._();

  factory DynamicLink.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DynamicLink.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DynamicLink',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'slug')
    ..aOS(3, _omitFieldNames ? '' : 'targetUrl')
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'metadata',
        subBuilder: $0.Json.create)
    ..aInt64(5, _omitFieldNames ? '' : 'expiresAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DynamicLink clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DynamicLink copyWith(void Function(DynamicLink) updates) =>
      super.copyWith((message) => updates(message as DynamicLink))
          as DynamicLink;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DynamicLink create() => DynamicLink._();
  @$core.override
  DynamicLink createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DynamicLink getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DynamicLink>(create);
  static DynamicLink? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get slug => $_getSZ(1);
  @$pb.TagNumber(2)
  set slug($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSlug() => $_has(1);
  @$pb.TagNumber(2)
  void clearSlug() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get targetUrl => $_getSZ(2);
  @$pb.TagNumber(3)
  set targetUrl($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasTargetUrl() => $_has(2);
  @$pb.TagNumber(3)
  void clearTargetUrl() => $_clearField(3);

  @$pb.TagNumber(4)
  $0.Json get metadata => $_getN(3);
  @$pb.TagNumber(4)
  set metadata($0.Json value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasMetadata() => $_has(3);
  @$pb.TagNumber(4)
  void clearMetadata() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Json ensureMetadata() => $_ensure(3);

  @$pb.TagNumber(5)
  $fixnum.Int64 get expiresAt => $_getI64(4);
  @$pb.TagNumber(5)
  set expiresAt($fixnum.Int64 value) => $_setInt64(4, value);
  @$pb.TagNumber(5)
  $core.bool hasExpiresAt() => $_has(4);
  @$pb.TagNumber(5)
  void clearExpiresAt() => $_clearField(5);
}

class AddLinkRequest extends $pb.GeneratedMessage {
  factory AddLinkRequest({
    DynamicLink? link,
  }) {
    final result = create();
    if (link != null) result.link = link;
    return result;
  }

  AddLinkRequest._();

  factory AddLinkRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory AddLinkRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'AddLinkRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOM<DynamicLink>(1, _omitFieldNames ? '' : 'link',
        subBuilder: DynamicLink.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddLinkRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AddLinkRequest copyWith(void Function(AddLinkRequest) updates) =>
      super.copyWith((message) => updates(message as AddLinkRequest))
          as AddLinkRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static AddLinkRequest create() => AddLinkRequest._();
  @$core.override
  AddLinkRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static AddLinkRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<AddLinkRequest>(create);
  static AddLinkRequest? _defaultInstance;

  @$pb.TagNumber(1)
  DynamicLink get link => $_getN(0);
  @$pb.TagNumber(1)
  set link(DynamicLink value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasLink() => $_has(0);
  @$pb.TagNumber(1)
  void clearLink() => $_clearField(1);
  @$pb.TagNumber(1)
  DynamicLink ensureLink() => $_ensure(0);
}

class UpdateLinkRequest extends $pb.GeneratedMessage {
  factory UpdateLinkRequest({
    DynamicLink? link,
  }) {
    final result = create();
    if (link != null) result.link = link;
    return result;
  }

  UpdateLinkRequest._();

  factory UpdateLinkRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UpdateLinkRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UpdateLinkRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOM<DynamicLink>(1, _omitFieldNames ? '' : 'link',
        subBuilder: DynamicLink.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpdateLinkRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpdateLinkRequest copyWith(void Function(UpdateLinkRequest) updates) =>
      super.copyWith((message) => updates(message as UpdateLinkRequest))
          as UpdateLinkRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UpdateLinkRequest create() => UpdateLinkRequest._();
  @$core.override
  UpdateLinkRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UpdateLinkRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UpdateLinkRequest>(create);
  static UpdateLinkRequest? _defaultInstance;

  @$pb.TagNumber(1)
  DynamicLink get link => $_getN(0);
  @$pb.TagNumber(1)
  set link(DynamicLink value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasLink() => $_has(0);
  @$pb.TagNumber(1)
  void clearLink() => $_clearField(1);
  @$pb.TagNumber(1)
  DynamicLink ensureLink() => $_ensure(0);
}

class RemoveLinkRequest extends $pb.GeneratedMessage {
  factory RemoveLinkRequest({
    $core.String? id,
    $core.String? slug,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (slug != null) result.slug = slug;
    return result;
  }

  RemoveLinkRequest._();

  factory RemoveLinkRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RemoveLinkRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RemoveLinkRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'slug')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoveLinkRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RemoveLinkRequest copyWith(void Function(RemoveLinkRequest) updates) =>
      super.copyWith((message) => updates(message as RemoveLinkRequest))
          as RemoveLinkRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RemoveLinkRequest create() => RemoveLinkRequest._();
  @$core.override
  RemoveLinkRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RemoveLinkRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RemoveLinkRequest>(create);
  static RemoveLinkRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get slug => $_getSZ(1);
  @$pb.TagNumber(2)
  set slug($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSlug() => $_has(1);
  @$pb.TagNumber(2)
  void clearSlug() => $_clearField(2);
}

class LinkResult extends $pb.GeneratedMessage {
  factory LinkResult({
    DynamicLink? link,
    $0.Failure? error,
  }) {
    final result = create();
    if (link != null) result.link = link;
    if (error != null) result.error = error;
    return result;
  }

  LinkResult._();

  factory LinkResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory LinkResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'LinkResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.devops.v1'),
      createEmptyInstance: create)
    ..aOM<DynamicLink>(1, _omitFieldNames ? '' : 'link',
        subBuilder: DynamicLink.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LinkResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  LinkResult copyWith(void Function(LinkResult) updates) =>
      super.copyWith((message) => updates(message as LinkResult)) as LinkResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static LinkResult create() => LinkResult._();
  @$core.override
  LinkResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static LinkResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<LinkResult>(create);
  static LinkResult? _defaultInstance;

  @$pb.TagNumber(1)
  DynamicLink get link => $_getN(0);
  @$pb.TagNumber(1)
  set link(DynamicLink value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasLink() => $_has(0);
  @$pb.TagNumber(1)
  void clearLink() => $_clearField(1);
  @$pb.TagNumber(1)
  DynamicLink ensureLink() => $_ensure(0);

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

class DynamicLinksApi {
  final $pb.RpcClient _client;

  DynamicLinksApi(this._client);

  $async.Future<LinkResult> add(
          $pb.ClientContext? ctx, AddLinkRequest request) =>
      _client.invoke<LinkResult>(
          ctx, 'DynamicLinks', 'Add', request, LinkResult());
  $async.Future<LinkResult> update(
          $pb.ClientContext? ctx, UpdateLinkRequest request) =>
      _client.invoke<LinkResult>(
          ctx, 'DynamicLinks', 'Update', request, LinkResult());
  $async.Future<LinkResult> remove(
          $pb.ClientContext? ctx, RemoveLinkRequest request) =>
      _client.invoke<LinkResult>(
          ctx, 'DynamicLinks', 'Remove', request, LinkResult());
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
