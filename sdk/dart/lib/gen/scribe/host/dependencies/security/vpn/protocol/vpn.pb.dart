// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/vpn/protocol/vpn.proto.

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

class Vpn extends $pb.GeneratedMessage {
  factory Vpn({
    $core.String? id,
    $core.String? name,
    $core.bool? enabled,
    $fixnum.Int64? createdAt,
    $fixnum.Int64? lastHandshakeAt,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (name != null) result.name = name;
    if (enabled != null) result.enabled = enabled;
    if (createdAt != null) result.createdAt = createdAt;
    if (lastHandshakeAt != null) result.lastHandshakeAt = lastHandshakeAt;
    return result;
  }

  Vpn._();

  factory Vpn.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Vpn.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Vpn',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'name')
    ..aOB(3, _omitFieldNames ? '' : 'enabled')
    ..aInt64(4, _omitFieldNames ? '' : 'createdAt')
    ..aInt64(5, _omitFieldNames ? '' : 'lastHandshakeAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Vpn clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Vpn copyWith(void Function(Vpn) updates) =>
      super.copyWith((message) => updates(message as Vpn)) as Vpn;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Vpn create() => Vpn._();
  @$core.override
  Vpn createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Vpn getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Vpn>(create);
  static Vpn? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get name => $_getSZ(1);
  @$pb.TagNumber(2)
  set name($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasName() => $_has(1);
  @$pb.TagNumber(2)
  void clearName() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.bool get enabled => $_getBF(2);
  @$pb.TagNumber(3)
  set enabled($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasEnabled() => $_has(2);
  @$pb.TagNumber(3)
  void clearEnabled() => $_clearField(3);

  @$pb.TagNumber(4)
  $fixnum.Int64 get createdAt => $_getI64(3);
  @$pb.TagNumber(4)
  set createdAt($fixnum.Int64 value) => $_setInt64(3, value);
  @$pb.TagNumber(4)
  $core.bool hasCreatedAt() => $_has(3);
  @$pb.TagNumber(4)
  void clearCreatedAt() => $_clearField(4);

  @$pb.TagNumber(5)
  $fixnum.Int64 get lastHandshakeAt => $_getI64(4);
  @$pb.TagNumber(5)
  set lastHandshakeAt($fixnum.Int64 value) => $_setInt64(4, value);
  @$pb.TagNumber(5)
  $core.bool hasLastHandshakeAt() => $_has(4);
  @$pb.TagNumber(5)
  void clearLastHandshakeAt() => $_clearField(5);
}

class VpnResult extends $pb.GeneratedMessage {
  factory VpnResult({
    Vpn? vpn,
    $0.Failure? error,
  }) {
    final result = create();
    if (vpn != null) result.vpn = vpn;
    if (error != null) result.error = error;
    return result;
  }

  VpnResult._();

  factory VpnResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory VpnResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'VpnResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOM<Vpn>(1, _omitFieldNames ? '' : 'vpn', subBuilder: Vpn.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VpnResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VpnResult copyWith(void Function(VpnResult) updates) =>
      super.copyWith((message) => updates(message as VpnResult)) as VpnResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static VpnResult create() => VpnResult._();
  @$core.override
  VpnResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static VpnResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<VpnResult>(create);
  static VpnResult? _defaultInstance;

  @$pb.TagNumber(1)
  Vpn get vpn => $_getN(0);
  @$pb.TagNumber(1)
  set vpn(Vpn value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasVpn() => $_has(0);
  @$pb.TagNumber(1)
  void clearVpn() => $_clearField(1);
  @$pb.TagNumber(1)
  Vpn ensureVpn() => $_ensure(0);

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

class VoidResult extends $pb.GeneratedMessage {
  factory VoidResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  VoidResult._();

  factory VoidResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory VoidResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'VoidResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VoidResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VoidResult copyWith(void Function(VoidResult) updates) =>
      super.copyWith((message) => updates(message as VoidResult)) as VoidResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static VoidResult create() => VoidResult._();
  @$core.override
  VoidResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static VoidResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<VoidResult>(create);
  static VoidResult? _defaultInstance;

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

class VpnRef extends $pb.GeneratedMessage {
  factory VpnRef({
    $core.String? vpnId,
  }) {
    final result = create();
    if (vpnId != null) result.vpnId = vpnId;
    return result;
  }

  VpnRef._();

  factory VpnRef.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory VpnRef.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'VpnRef',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'vpnId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VpnRef clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VpnRef copyWith(void Function(VpnRef) updates) =>
      super.copyWith((message) => updates(message as VpnRef)) as VpnRef;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static VpnRef create() => VpnRef._();
  @$core.override
  VpnRef createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static VpnRef getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<VpnRef>(create);
  static VpnRef? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get vpnId => $_getSZ(0);
  @$pb.TagNumber(1)
  set vpnId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasVpnId() => $_has(0);
  @$pb.TagNumber(1)
  void clearVpnId() => $_clearField(1);
}

class OwnerRef extends $pb.GeneratedMessage {
  factory OwnerRef({
    $core.String? name,
  }) {
    final result = create();
    if (name != null) result.name = name;
    return result;
  }

  OwnerRef._();

  factory OwnerRef.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory OwnerRef.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'OwnerRef',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'name')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  OwnerRef clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  OwnerRef copyWith(void Function(OwnerRef) updates) =>
      super.copyWith((message) => updates(message as OwnerRef)) as OwnerRef;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static OwnerRef create() => OwnerRef._();
  @$core.override
  OwnerRef createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static OwnerRef getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<OwnerRef>(create);
  static OwnerRef? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get name => $_getSZ(0);
  @$pb.TagNumber(1)
  set name($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasName() => $_has(0);
  @$pb.TagNumber(1)
  void clearName() => $_clearField(1);
}

class CreateRequest extends $pb.GeneratedMessage {
  factory CreateRequest({
    $core.String? name,
  }) {
    final result = create();
    if (name != null) result.name = name;
    return result;
  }

  CreateRequest._();

  factory CreateRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory CreateRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'CreateRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'name')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CreateRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  CreateRequest copyWith(void Function(CreateRequest) updates) =>
      super.copyWith((message) => updates(message as CreateRequest))
          as CreateRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static CreateRequest create() => CreateRequest._();
  @$core.override
  CreateRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static CreateRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<CreateRequest>(create);
  static CreateRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get name => $_getSZ(0);
  @$pb.TagNumber(1)
  set name($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasName() => $_has(0);
  @$pb.TagNumber(1)
  void clearName() => $_clearField(1);
}

class RenameRequest extends $pb.GeneratedMessage {
  factory RenameRequest({
    $core.String? vpnId,
    $core.String? name,
  }) {
    final result = create();
    if (vpnId != null) result.vpnId = vpnId;
    if (name != null) result.name = name;
    return result;
  }

  RenameRequest._();

  factory RenameRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RenameRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RenameRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'vpnId')
    ..aOS(2, _omitFieldNames ? '' : 'name')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RenameRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RenameRequest copyWith(void Function(RenameRequest) updates) =>
      super.copyWith((message) => updates(message as RenameRequest))
          as RenameRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RenameRequest create() => RenameRequest._();
  @$core.override
  RenameRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RenameRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RenameRequest>(create);
  static RenameRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get vpnId => $_getSZ(0);
  @$pb.TagNumber(1)
  set vpnId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasVpnId() => $_has(0);
  @$pb.TagNumber(1)
  void clearVpnId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get name => $_getSZ(1);
  @$pb.TagNumber(2)
  set name($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasName() => $_has(1);
  @$pb.TagNumber(2)
  void clearName() => $_clearField(2);
}

class PaginationRequest extends $pb.GeneratedMessage {
  factory PaginationRequest({
    $core.int? offset,
    $core.int? size,
  }) {
    final result = create();
    if (offset != null) result.offset = offset;
    if (size != null) result.size = size;
    return result;
  }

  PaginationRequest._();

  factory PaginationRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PaginationRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PaginationRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aI(1, _omitFieldNames ? '' : 'offset', fieldType: $pb.PbFieldType.OU3)
    ..aI(2, _omitFieldNames ? '' : 'size', fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PaginationRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PaginationRequest copyWith(void Function(PaginationRequest) updates) =>
      super.copyWith((message) => updates(message as PaginationRequest))
          as PaginationRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PaginationRequest create() => PaginationRequest._();
  @$core.override
  PaginationRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PaginationRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PaginationRequest>(create);
  static PaginationRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.int get offset => $_getIZ(0);
  @$pb.TagNumber(1)
  set offset($core.int value) => $_setUnsignedInt32(0, value);
  @$pb.TagNumber(1)
  $core.bool hasOffset() => $_has(0);
  @$pb.TagNumber(1)
  void clearOffset() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.int get size => $_getIZ(1);
  @$pb.TagNumber(2)
  set size($core.int value) => $_setUnsignedInt32(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSize() => $_has(1);
  @$pb.TagNumber(2)
  void clearSize() => $_clearField(2);
}

class PaginationResult extends $pb.GeneratedMessage {
  factory PaginationResult({
    $core.Iterable<Vpn>? vpns,
    $fixnum.Int64? total,
    $0.Failure? error,
  }) {
    final result = create();
    if (vpns != null) result.vpns.addAll(vpns);
    if (total != null) result.total = total;
    if (error != null) result.error = error;
    return result;
  }

  PaginationResult._();

  factory PaginationResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory PaginationResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'PaginationResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..pPM<Vpn>(1, _omitFieldNames ? '' : 'vpns', subBuilder: Vpn.create)
    ..a<$fixnum.Int64>(2, _omitFieldNames ? '' : 'total', $pb.PbFieldType.OU6,
        defaultOrMaker: $fixnum.Int64.ZERO)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PaginationResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  PaginationResult copyWith(void Function(PaginationResult) updates) =>
      super.copyWith((message) => updates(message as PaginationResult))
          as PaginationResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static PaginationResult create() => PaginationResult._();
  @$core.override
  PaginationResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static PaginationResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<PaginationResult>(create);
  static PaginationResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Vpn> get vpns => $_getList(0);

  @$pb.TagNumber(2)
  $fixnum.Int64 get total => $_getI64(1);
  @$pb.TagNumber(2)
  set total($fixnum.Int64 value) => $_setInt64(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTotal() => $_has(1);
  @$pb.TagNumber(2)
  void clearTotal() => $_clearField(2);

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

class ConfigurationResult extends $pb.GeneratedMessage {
  factory ConfigurationResult({
    $core.String? configuration,
    $0.Failure? error,
  }) {
    final result = create();
    if (configuration != null) result.configuration = configuration;
    if (error != null) result.error = error;
    return result;
  }

  ConfigurationResult._();

  factory ConfigurationResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ConfigurationResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ConfigurationResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'configuration')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ConfigurationResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ConfigurationResult copyWith(void Function(ConfigurationResult) updates) =>
      super.copyWith((message) => updates(message as ConfigurationResult))
          as ConfigurationResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ConfigurationResult create() => ConfigurationResult._();
  @$core.override
  ConfigurationResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ConfigurationResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ConfigurationResult>(create);
  static ConfigurationResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get configuration => $_getSZ(0);
  @$pb.TagNumber(1)
  set configuration($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasConfiguration() => $_has(0);
  @$pb.TagNumber(1)
  void clearConfiguration() => $_clearField(1);

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

class QrcodeResult extends $pb.GeneratedMessage {
  factory QrcodeResult({
    $core.String? qrcode,
    $0.Failure? error,
  }) {
    final result = create();
    if (qrcode != null) result.qrcode = qrcode;
    if (error != null) result.error = error;
    return result;
  }

  QrcodeResult._();

  factory QrcodeResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory QrcodeResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'QrcodeResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.vpn.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'qrcode')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QrcodeResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  QrcodeResult copyWith(void Function(QrcodeResult) updates) =>
      super.copyWith((message) => updates(message as QrcodeResult))
          as QrcodeResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static QrcodeResult create() => QrcodeResult._();
  @$core.override
  QrcodeResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static QrcodeResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<QrcodeResult>(create);
  static QrcodeResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get qrcode => $_getSZ(0);
  @$pb.TagNumber(1)
  set qrcode($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQrcode() => $_has(0);
  @$pb.TagNumber(1)
  void clearQrcode() => $_clearField(1);

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

class VpnAdminApi {
  final $pb.RpcClient _client;

  VpnAdminApi(this._client);

  $async.Future<VpnResult> get($pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<VpnResult>(ctx, 'VpnAdmin', 'Get', request, VpnResult());
  $async.Future<VpnResult> getByOwner(
          $pb.ClientContext? ctx, OwnerRef request) =>
      _client.invoke<VpnResult>(
          ctx, 'VpnAdmin', 'GetByOwner', request, VpnResult());
  $async.Future<VpnResult> create_(
          $pb.ClientContext? ctx, CreateRequest request) =>
      _client.invoke<VpnResult>(
          ctx, 'VpnAdmin', 'Create', request, VpnResult());
  $async.Future<VoidResult> delete($pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'Delete', request, VoidResult());
  $async.Future<VoidResult> deleteAll(
          $pb.ClientContext? ctx, OwnerRef request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'DeleteAll', request, VoidResult());
  $async.Future<VoidResult> enable($pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'Enable', request, VoidResult());
  $async.Future<VoidResult> disable($pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'Disable', request, VoidResult());
  $async.Future<VoidResult> disableAll(
          $pb.ClientContext? ctx, OwnerRef request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'DisableAll', request, VoidResult());
  $async.Future<VoidResult> rename(
          $pb.ClientContext? ctx, RenameRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'VpnAdmin', 'Rename', request, VoidResult());
  $async.Future<PaginationResult> pagination(
          $pb.ClientContext? ctx, PaginationRequest request) =>
      _client.invoke<PaginationResult>(
          ctx, 'VpnAdmin', 'Pagination', request, PaginationResult());
  $async.Future<ConfigurationResult> configuration(
          $pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<ConfigurationResult>(
          ctx, 'VpnAdmin', 'Configuration', request, ConfigurationResult());
  $async.Future<QrcodeResult> qrcode($pb.ClientContext? ctx, VpnRef request) =>
      _client.invoke<QrcodeResult>(
          ctx, 'VpnAdmin', 'Qrcode', request, QrcodeResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
