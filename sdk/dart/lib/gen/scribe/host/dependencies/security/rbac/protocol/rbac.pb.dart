// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/rbac/protocol/rbac.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $1;
import '../../../../../protocol/invocation.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class RulesRequest extends $pb.GeneratedMessage {
  factory RulesRequest({
    $core.String? adminId,
  }) {
    final result = create();
    if (adminId != null) result.adminId = adminId;
    return result;
  }

  RulesRequest._();

  factory RulesRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RulesRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RulesRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.rbac.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'adminId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RulesRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RulesRequest copyWith(void Function(RulesRequest) updates) =>
      super.copyWith((message) => updates(message as RulesRequest))
          as RulesRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RulesRequest create() => RulesRequest._();
  @$core.override
  RulesRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RulesRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RulesRequest>(create);
  static RulesRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get adminId => $_getSZ(0);
  @$pb.TagNumber(1)
  set adminId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAdminId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAdminId() => $_clearField(1);
}

class RulesResult extends $pb.GeneratedMessage {
  factory RulesResult({
    $0.Rules? rules,
    $1.Failure? error,
  }) {
    final result = create();
    if (rules != null) result.rules = rules;
    if (error != null) result.error = error;
    return result;
  }

  RulesResult._();

  factory RulesResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RulesResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RulesResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.rbac.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Rules>(1, _omitFieldNames ? '' : 'rules',
        subBuilder: $0.Rules.create)
    ..aOM<$1.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $1.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RulesResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RulesResult copyWith(void Function(RulesResult) updates) =>
      super.copyWith((message) => updates(message as RulesResult))
          as RulesResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RulesResult create() => RulesResult._();
  @$core.override
  RulesResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RulesResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RulesResult>(create);
  static RulesResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Rules get rules => $_getN(0);
  @$pb.TagNumber(1)
  set rules($0.Rules value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasRules() => $_has(0);
  @$pb.TagNumber(1)
  void clearRules() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Rules ensureRules() => $_ensure(0);

  @$pb.TagNumber(2)
  $1.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($1.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $1.Failure ensureError() => $_ensure(1);
}

class PermissionRequest extends $pb.GeneratedMessage {
  factory PermissionRequest({
    $core.String? adminId,
    $core.Iterable<$core.String>? permissions,
    $core.bool? requireAll,
  }) {
    final result = create();
    if (adminId != null) result.adminId = adminId;
    if (permissions != null) result.permissions.addAll(permissions);
    if (requireAll != null) result.requireAll = requireAll;
    return result;
  }

  PermissionRequest._();

  factory PermissionRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PermissionRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PermissionRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.rbac.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'adminId')
    ..pPS(2, _omitFieldNames ? '' : 'permissions')
    ..aOB(3, _omitFieldNames ? '' : 'requireAll')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PermissionRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PermissionRequest copyWith(void Function(PermissionRequest) updates) =>
      super.copyWith((message) => updates(message as PermissionRequest))
          as PermissionRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PermissionRequest create() => PermissionRequest._();
  @$core.override
  PermissionRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PermissionRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PermissionRequest>(create);
  static PermissionRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get adminId => $_getSZ(0);
  @$pb.TagNumber(1)
  set adminId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAdminId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAdminId() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get permissions => $_getList(1);

  @$pb.TagNumber(3)
  $core.bool get requireAll => $_getBF(2);
  @$pb.TagNumber(3)
  set requireAll($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasRequireAll() => $_has(2);
  @$pb.TagNumber(3)
  void clearRequireAll() => $_clearField(3);
}

class PermissionResult extends $pb.GeneratedMessage {
  factory PermissionResult({
    $core.bool? granted,
    $core.Iterable<$core.String>? missing,
  }) {
    final result = create();
    if (granted != null) result.granted = granted;
    if (missing != null) result.missing.addAll(missing);
    return result;
  }

  PermissionResult._();

  factory PermissionResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PermissionResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PermissionResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.rbac.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'granted')
    ..pPS(2, _omitFieldNames ? '' : 'missing')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PermissionResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PermissionResult copyWith(void Function(PermissionResult) updates) =>
      super.copyWith((message) => updates(message as PermissionResult))
          as PermissionResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PermissionResult create() => PermissionResult._();
  @$core.override
  PermissionResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PermissionResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PermissionResult>(create);
  static PermissionResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get granted => $_getBF(0);
  @$pb.TagNumber(1)
  set granted($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasGranted() => $_has(0);
  @$pb.TagNumber(1)
  void clearGranted() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get missing => $_getList(1);
}

class RbacApi {
  final $pb.RpcClient _client;

  RbacApi(this._client);

  $async.Future<RulesResult> getRules(
          $pb.ClientContext? ctx, RulesRequest request) =>
      _client.invoke<RulesResult>(
          ctx, 'Rbac', 'GetRules', request, RulesResult());
  $async.Future<PermissionResult> hasPermission(
          $pb.ClientContext? ctx, PermissionRequest request) =>
      _client.invoke<PermissionResult>(
          ctx, 'Rbac', 'HasPermission', request, PermissionResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
