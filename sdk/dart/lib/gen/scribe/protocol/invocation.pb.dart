// This is a generated file - do not edit.
//
// Generated from scribe/protocol/invocation.proto.

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

import 'common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Rules extends $pb.GeneratedMessage {
  factory Rules({
    $core.String? role,
    $core.Iterable<$core.String>? permissions,
  }) {
    final result = create();
    if (role != null) result.role = role;
    if (permissions != null) result.permissions.addAll(permissions);
    return result;
  }

  Rules._();

  factory Rules.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Rules.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Rules',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'role')
    ..pPS(2, _omitFieldNames ? '' : 'permissions')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Rules clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Rules copyWith(void Function(Rules) updates) =>
      super.copyWith((message) => updates(message as Rules)) as Rules;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Rules create() => Rules._();
  @$core.override
  Rules createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Rules getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Rules>(create);
  static Rules? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get role => $_getSZ(0);
  @$pb.TagNumber(1)
  set role($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasRole() => $_has(0);
  @$pb.TagNumber(1)
  void clearRole() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get permissions => $_getList(1);
}

class Identity extends $pb.GeneratedMessage {
  factory Identity({
    $core.String? id,
    $core.String? email,
    $0.Caller? caller,
    Rules? rules,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (email != null) result.email = email;
    if (caller != null) result.caller = caller;
    if (rules != null) result.rules = rules;
    return result;
  }

  Identity._();

  factory Identity.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Identity.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Identity',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'email')
    ..aE<$0.Caller>(3, _omitFieldNames ? '' : 'caller',
        enumValues: $0.Caller.values)
    ..aOM<Rules>(4, _omitFieldNames ? '' : 'rules', subBuilder: Rules.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Identity clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Identity copyWith(void Function(Identity) updates) =>
      super.copyWith((message) => updates(message as Identity)) as Identity;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Identity create() => Identity._();
  @$core.override
  Identity createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Identity getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Identity>(create);
  static Identity? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get email => $_getSZ(1);
  @$pb.TagNumber(2)
  set email($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasEmail() => $_has(1);
  @$pb.TagNumber(2)
  void clearEmail() => $_clearField(2);

  @$pb.TagNumber(3)
  $0.Caller get caller => $_getN(2);
  @$pb.TagNumber(3)
  set caller($0.Caller value) => $_setField(3, value);
  @$pb.TagNumber(3)
  $core.bool hasCaller() => $_has(2);
  @$pb.TagNumber(3)
  void clearCaller() => $_clearField(3);

  @$pb.TagNumber(4)
  Rules get rules => $_getN(3);
  @$pb.TagNumber(4)
  set rules(Rules value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasRules() => $_has(3);
  @$pb.TagNumber(4)
  void clearRules() => $_clearField(4);
  @$pb.TagNumber(4)
  Rules ensureRules() => $_ensure(3);
}

class Localization extends $pb.GeneratedMessage {
  factory Localization({
    $core.String? language,
    $core.String? region,
    $core.String? timezone,
  }) {
    final result = create();
    if (language != null) result.language = language;
    if (region != null) result.region = region;
    if (timezone != null) result.timezone = timezone;
    return result;
  }

  Localization._();

  factory Localization.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Localization.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Localization',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'language')
    ..aOS(2, _omitFieldNames ? '' : 'region')
    ..aOS(3, _omitFieldNames ? '' : 'timezone')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Localization clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Localization copyWith(void Function(Localization) updates) =>
      super.copyWith((message) => updates(message as Localization))
          as Localization;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Localization create() => Localization._();
  @$core.override
  Localization createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Localization getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<Localization>(create);
  static Localization? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get language => $_getSZ(0);
  @$pb.TagNumber(1)
  set language($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasLanguage() => $_has(0);
  @$pb.TagNumber(1)
  void clearLanguage() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get region => $_getSZ(1);
  @$pb.TagNumber(2)
  set region($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRegion() => $_has(1);
  @$pb.TagNumber(2)
  void clearRegion() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get timezone => $_getSZ(2);
  @$pb.TagNumber(3)
  set timezone($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasTimezone() => $_has(2);
  @$pb.TagNumber(3)
  void clearTimezone() => $_clearField(3);
}

class Device extends $pb.GeneratedMessage {
  factory Device({
    $core.String? deviceId,
    $core.String? client,
    $core.String? os,
    $core.String? model,
    $core.String? appVersion,
    $core.bool? isPhysicalDevice,
    $core.String? deviceCategory,
    $core.String? notificationToken,
    $core.String? deviceToken,
    Localization? localization,
    $core.String? themeMode,
    $core.String? binding,
    $fixnum.Int64? iat,
    $core.String? nonce,
  }) {
    final result = create();
    if (deviceId != null) result.deviceId = deviceId;
    if (client != null) result.client = client;
    if (os != null) result.os = os;
    if (model != null) result.model = model;
    if (appVersion != null) result.appVersion = appVersion;
    if (isPhysicalDevice != null) result.isPhysicalDevice = isPhysicalDevice;
    if (deviceCategory != null) result.deviceCategory = deviceCategory;
    if (notificationToken != null) result.notificationToken = notificationToken;
    if (deviceToken != null) result.deviceToken = deviceToken;
    if (localization != null) result.localization = localization;
    if (themeMode != null) result.themeMode = themeMode;
    if (binding != null) result.binding = binding;
    if (iat != null) result.iat = iat;
    if (nonce != null) result.nonce = nonce;
    return result;
  }

  Device._();

  factory Device.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Device.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Device',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'deviceId')
    ..aOS(2, _omitFieldNames ? '' : 'client')
    ..aOS(3, _omitFieldNames ? '' : 'os')
    ..aOS(4, _omitFieldNames ? '' : 'model')
    ..aOS(5, _omitFieldNames ? '' : 'appVersion')
    ..aOB(6, _omitFieldNames ? '' : 'isPhysicalDevice')
    ..aOS(7, _omitFieldNames ? '' : 'deviceCategory')
    ..aOS(8, _omitFieldNames ? '' : 'notificationToken')
    ..aOS(9, _omitFieldNames ? '' : 'deviceToken')
    ..aOM<Localization>(10, _omitFieldNames ? '' : 'localization',
        subBuilder: Localization.create)
    ..aOS(11, _omitFieldNames ? '' : 'themeMode')
    ..aOS(12, _omitFieldNames ? '' : 'binding')
    ..aInt64(13, _omitFieldNames ? '' : 'iat')
    ..aOS(14, _omitFieldNames ? '' : 'nonce')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Device clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Device copyWith(void Function(Device) updates) =>
      super.copyWith((message) => updates(message as Device)) as Device;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Device create() => Device._();
  @$core.override
  Device createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Device getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Device>(create);
  static Device? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get deviceId => $_getSZ(0);
  @$pb.TagNumber(1)
  set deviceId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasDeviceId() => $_has(0);
  @$pb.TagNumber(1)
  void clearDeviceId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get client => $_getSZ(1);
  @$pb.TagNumber(2)
  set client($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasClient() => $_has(1);
  @$pb.TagNumber(2)
  void clearClient() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get os => $_getSZ(2);
  @$pb.TagNumber(3)
  set os($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasOs() => $_has(2);
  @$pb.TagNumber(3)
  void clearOs() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get model => $_getSZ(3);
  @$pb.TagNumber(4)
  set model($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasModel() => $_has(3);
  @$pb.TagNumber(4)
  void clearModel() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.String get appVersion => $_getSZ(4);
  @$pb.TagNumber(5)
  set appVersion($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasAppVersion() => $_has(4);
  @$pb.TagNumber(5)
  void clearAppVersion() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.bool get isPhysicalDevice => $_getBF(5);
  @$pb.TagNumber(6)
  set isPhysicalDevice($core.bool value) => $_setBool(5, value);
  @$pb.TagNumber(6)
  $core.bool hasIsPhysicalDevice() => $_has(5);
  @$pb.TagNumber(6)
  void clearIsPhysicalDevice() => $_clearField(6);

  @$pb.TagNumber(7)
  $core.String get deviceCategory => $_getSZ(6);
  @$pb.TagNumber(7)
  set deviceCategory($core.String value) => $_setString(6, value);
  @$pb.TagNumber(7)
  $core.bool hasDeviceCategory() => $_has(6);
  @$pb.TagNumber(7)
  void clearDeviceCategory() => $_clearField(7);

  @$pb.TagNumber(8)
  $core.String get notificationToken => $_getSZ(7);
  @$pb.TagNumber(8)
  set notificationToken($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasNotificationToken() => $_has(7);
  @$pb.TagNumber(8)
  void clearNotificationToken() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.String get deviceToken => $_getSZ(8);
  @$pb.TagNumber(9)
  set deviceToken($core.String value) => $_setString(8, value);
  @$pb.TagNumber(9)
  $core.bool hasDeviceToken() => $_has(8);
  @$pb.TagNumber(9)
  void clearDeviceToken() => $_clearField(9);

  @$pb.TagNumber(10)
  Localization get localization => $_getN(9);
  @$pb.TagNumber(10)
  set localization(Localization value) => $_setField(10, value);
  @$pb.TagNumber(10)
  $core.bool hasLocalization() => $_has(9);
  @$pb.TagNumber(10)
  void clearLocalization() => $_clearField(10);
  @$pb.TagNumber(10)
  Localization ensureLocalization() => $_ensure(9);

  @$pb.TagNumber(11)
  $core.String get themeMode => $_getSZ(10);
  @$pb.TagNumber(11)
  set themeMode($core.String value) => $_setString(10, value);
  @$pb.TagNumber(11)
  $core.bool hasThemeMode() => $_has(10);
  @$pb.TagNumber(11)
  void clearThemeMode() => $_clearField(11);

  @$pb.TagNumber(12)
  $core.String get binding => $_getSZ(11);
  @$pb.TagNumber(12)
  set binding($core.String value) => $_setString(11, value);
  @$pb.TagNumber(12)
  $core.bool hasBinding() => $_has(11);
  @$pb.TagNumber(12)
  void clearBinding() => $_clearField(12);

  @$pb.TagNumber(13)
  $fixnum.Int64 get iat => $_getI64(12);
  @$pb.TagNumber(13)
  set iat($fixnum.Int64 value) => $_setInt64(12, value);
  @$pb.TagNumber(13)
  $core.bool hasIat() => $_has(12);
  @$pb.TagNumber(13)
  void clearIat() => $_clearField(13);

  @$pb.TagNumber(14)
  $core.String get nonce => $_getSZ(13);
  @$pb.TagNumber(14)
  set nonce($core.String value) => $_setString(13, value);
  @$pb.TagNumber(14)
  $core.bool hasNonce() => $_has(13);
  @$pb.TagNumber(14)
  void clearNonce() => $_clearField(14);
}

class IpLocation extends $pb.GeneratedMessage {
  factory IpLocation({
    $core.String? city,
    $core.String? country,
  }) {
    final result = create();
    if (city != null) result.city = city;
    if (country != null) result.country = country;
    return result;
  }

  IpLocation._();

  factory IpLocation.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory IpLocation.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'IpLocation',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'city')
    ..aOS(2, _omitFieldNames ? '' : 'country')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  IpLocation clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  IpLocation copyWith(void Function(IpLocation) updates) =>
      super.copyWith((message) => updates(message as IpLocation)) as IpLocation;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static IpLocation create() => IpLocation._();
  @$core.override
  IpLocation createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static IpLocation getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<IpLocation>(create);
  static IpLocation? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get city => $_getSZ(0);
  @$pb.TagNumber(1)
  set city($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasCity() => $_has(0);
  @$pb.TagNumber(1)
  void clearCity() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get country => $_getSZ(1);
  @$pb.TagNumber(2)
  set country($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasCountry() => $_has(1);
  @$pb.TagNumber(2)
  void clearCountry() => $_clearField(2);
}

class Coordinates extends $pb.GeneratedMessage {
  factory Coordinates({
    $core.double? lat,
    $core.double? lng,
  }) {
    final result = create();
    if (lat != null) result.lat = lat;
    if (lng != null) result.lng = lng;
    return result;
  }

  Coordinates._();

  factory Coordinates.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Coordinates.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Coordinates',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aD(1, _omitFieldNames ? '' : 'lat')
    ..aD(2, _omitFieldNames ? '' : 'lng')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Coordinates clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Coordinates copyWith(void Function(Coordinates) updates) =>
      super.copyWith((message) => updates(message as Coordinates))
          as Coordinates;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Coordinates create() => Coordinates._();
  @$core.override
  Coordinates createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Coordinates getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<Coordinates>(create);
  static Coordinates? _defaultInstance;

  @$pb.TagNumber(1)
  $core.double get lat => $_getN(0);
  @$pb.TagNumber(1)
  set lat($core.double value) => $_setDouble(0, value);
  @$pb.TagNumber(1)
  $core.bool hasLat() => $_has(0);
  @$pb.TagNumber(1)
  void clearLat() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.double get lng => $_getN(1);
  @$pb.TagNumber(2)
  set lng($core.double value) => $_setDouble(1, value);
  @$pb.TagNumber(2)
  $core.bool hasLng() => $_has(1);
  @$pb.TagNumber(2)
  void clearLng() => $_clearField(2);
}

class Request extends $pb.GeneratedMessage {
  factory Request({
    $0.Method? method,
    $core.String? path,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? pathParams,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? query,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? headers,
    $core.List<$core.int>? body,
    $core.String? ip,
    $core.String? userAgent,
    $core.String? sessionId,
  }) {
    final result = create();
    if (method != null) result.method = method;
    if (path != null) result.path = path;
    if (pathParams != null) result.pathParams.addEntries(pathParams);
    if (query != null) result.query.addEntries(query);
    if (headers != null) result.headers.addEntries(headers);
    if (body != null) result.body = body;
    if (ip != null) result.ip = ip;
    if (userAgent != null) result.userAgent = userAgent;
    if (sessionId != null) result.sessionId = sessionId;
    return result;
  }

  Request._();

  factory Request.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Request.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Request',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aE<$0.Method>(1, _omitFieldNames ? '' : 'method',
        enumValues: $0.Method.values)
    ..aOS(2, _omitFieldNames ? '' : 'path')
    ..m<$core.String, $core.String>(3, _omitFieldNames ? '' : 'pathParams',
        entryClassName: 'Request.PathParamsEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.v1'))
    ..m<$core.String, $core.String>(4, _omitFieldNames ? '' : 'query',
        entryClassName: 'Request.QueryEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.v1'))
    ..m<$core.String, $core.String>(5, _omitFieldNames ? '' : 'headers',
        entryClassName: 'Request.HeadersEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.v1'))
    ..a<$core.List<$core.int>>(
        6, _omitFieldNames ? '' : 'body', $pb.PbFieldType.OY)
    ..aOS(7, _omitFieldNames ? '' : 'ip')
    ..aOS(8, _omitFieldNames ? '' : 'userAgent')
    ..aOS(9, _omitFieldNames ? '' : 'sessionId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Request clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Request copyWith(void Function(Request) updates) =>
      super.copyWith((message) => updates(message as Request)) as Request;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Request create() => Request._();
  @$core.override
  Request createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Request getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Request>(create);
  static Request? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Method get method => $_getN(0);
  @$pb.TagNumber(1)
  set method($0.Method value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasMethod() => $_has(0);
  @$pb.TagNumber(1)
  void clearMethod() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get path => $_getSZ(1);
  @$pb.TagNumber(2)
  set path($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasPath() => $_has(1);
  @$pb.TagNumber(2)
  void clearPath() => $_clearField(2);

  @$pb.TagNumber(3)
  $pb.PbMap<$core.String, $core.String> get pathParams => $_getMap(2);

  @$pb.TagNumber(4)
  $pb.PbMap<$core.String, $core.String> get query => $_getMap(3);

  @$pb.TagNumber(5)
  $pb.PbMap<$core.String, $core.String> get headers => $_getMap(4);

  @$pb.TagNumber(6)
  $core.List<$core.int> get body => $_getN(5);
  @$pb.TagNumber(6)
  set body($core.List<$core.int> value) => $_setBytes(5, value);
  @$pb.TagNumber(6)
  $core.bool hasBody() => $_has(5);
  @$pb.TagNumber(6)
  void clearBody() => $_clearField(6);

  @$pb.TagNumber(7)
  $core.String get ip => $_getSZ(6);
  @$pb.TagNumber(7)
  set ip($core.String value) => $_setString(6, value);
  @$pb.TagNumber(7)
  $core.bool hasIp() => $_has(6);
  @$pb.TagNumber(7)
  void clearIp() => $_clearField(7);

  @$pb.TagNumber(8)
  $core.String get userAgent => $_getSZ(7);
  @$pb.TagNumber(8)
  set userAgent($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasUserAgent() => $_has(7);
  @$pb.TagNumber(8)
  void clearUserAgent() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.String get sessionId => $_getSZ(8);
  @$pb.TagNumber(9)
  set sessionId($core.String value) => $_setString(8, value);
  @$pb.TagNumber(9)
  $core.bool hasSessionId() => $_has(8);
  @$pb.TagNumber(9)
  void clearSessionId() => $_clearField(9);
}

class Invocation extends $pb.GeneratedMessage {
  factory Invocation({
    $core.String? invocationId,
    $core.String? traceId,
    $core.String? routeId,
    Request? request,
    Identity? identity,
    Device? device,
    IpLocation? location,
    $core.String? capabilityToken,
  }) {
    final result = create();
    if (invocationId != null) result.invocationId = invocationId;
    if (traceId != null) result.traceId = traceId;
    if (routeId != null) result.routeId = routeId;
    if (request != null) result.request = request;
    if (identity != null) result.identity = identity;
    if (device != null) result.device = device;
    if (location != null) result.location = location;
    if (capabilityToken != null) result.capabilityToken = capabilityToken;
    return result;
  }

  Invocation._();

  factory Invocation.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Invocation.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Invocation',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'invocationId')
    ..aOS(2, _omitFieldNames ? '' : 'traceId')
    ..aOS(3, _omitFieldNames ? '' : 'routeId')
    ..aOM<Request>(4, _omitFieldNames ? '' : 'request',
        subBuilder: Request.create)
    ..aOM<Identity>(5, _omitFieldNames ? '' : 'identity',
        subBuilder: Identity.create)
    ..aOM<Device>(6, _omitFieldNames ? '' : 'device', subBuilder: Device.create)
    ..aOM<IpLocation>(7, _omitFieldNames ? '' : 'location',
        subBuilder: IpLocation.create)
    ..aOS(8, _omitFieldNames ? '' : 'capabilityToken')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Invocation clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Invocation copyWith(void Function(Invocation) updates) =>
      super.copyWith((message) => updates(message as Invocation)) as Invocation;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Invocation create() => Invocation._();
  @$core.override
  Invocation createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Invocation getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<Invocation>(create);
  static Invocation? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get invocationId => $_getSZ(0);
  @$pb.TagNumber(1)
  set invocationId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasInvocationId() => $_has(0);
  @$pb.TagNumber(1)
  void clearInvocationId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get traceId => $_getSZ(1);
  @$pb.TagNumber(2)
  set traceId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasTraceId() => $_has(1);
  @$pb.TagNumber(2)
  void clearTraceId() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get routeId => $_getSZ(2);
  @$pb.TagNumber(3)
  set routeId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasRouteId() => $_has(2);
  @$pb.TagNumber(3)
  void clearRouteId() => $_clearField(3);

  @$pb.TagNumber(4)
  Request get request => $_getN(3);
  @$pb.TagNumber(4)
  set request(Request value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasRequest() => $_has(3);
  @$pb.TagNumber(4)
  void clearRequest() => $_clearField(4);
  @$pb.TagNumber(4)
  Request ensureRequest() => $_ensure(3);

  @$pb.TagNumber(5)
  Identity get identity => $_getN(4);
  @$pb.TagNumber(5)
  set identity(Identity value) => $_setField(5, value);
  @$pb.TagNumber(5)
  $core.bool hasIdentity() => $_has(4);
  @$pb.TagNumber(5)
  void clearIdentity() => $_clearField(5);
  @$pb.TagNumber(5)
  Identity ensureIdentity() => $_ensure(4);

  @$pb.TagNumber(6)
  Device get device => $_getN(5);
  @$pb.TagNumber(6)
  set device(Device value) => $_setField(6, value);
  @$pb.TagNumber(6)
  $core.bool hasDevice() => $_has(5);
  @$pb.TagNumber(6)
  void clearDevice() => $_clearField(6);
  @$pb.TagNumber(6)
  Device ensureDevice() => $_ensure(5);

  @$pb.TagNumber(7)
  IpLocation get location => $_getN(6);
  @$pb.TagNumber(7)
  set location(IpLocation value) => $_setField(7, value);
  @$pb.TagNumber(7)
  $core.bool hasLocation() => $_has(6);
  @$pb.TagNumber(7)
  void clearLocation() => $_clearField(7);
  @$pb.TagNumber(7)
  IpLocation ensureLocation() => $_ensure(6);

  @$pb.TagNumber(8)
  $core.String get capabilityToken => $_getSZ(7);
  @$pb.TagNumber(8)
  set capabilityToken($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasCapabilityToken() => $_has(7);
  @$pb.TagNumber(8)
  void clearCapabilityToken() => $_clearField(8);
}

class Reply extends $pb.GeneratedMessage {
  factory Reply({
    $core.String? invocationId,
    $core.int? status,
    $core.Iterable<$core.MapEntry<$core.String, $core.String>>? headers,
    $core.List<$core.int>? body,
    $0.Failure? failure,
  }) {
    final result = create();
    if (invocationId != null) result.invocationId = invocationId;
    if (status != null) result.status = status;
    if (headers != null) result.headers.addEntries(headers);
    if (body != null) result.body = body;
    if (failure != null) result.failure = failure;
    return result;
  }

  Reply._();

  factory Reply.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Reply.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Reply',
      package: const $pb.PackageName(_omitMessageNames ? '' : 'scribe.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'invocationId')
    ..aI(2, _omitFieldNames ? '' : 'status', fieldType: $pb.PbFieldType.OU3)
    ..m<$core.String, $core.String>(3, _omitFieldNames ? '' : 'headers',
        entryClassName: 'Reply.HeadersEntry',
        keyFieldType: $pb.PbFieldType.OS,
        valueFieldType: $pb.PbFieldType.OS,
        packageName: const $pb.PackageName('scribe.v1'))
    ..a<$core.List<$core.int>>(
        4, _omitFieldNames ? '' : 'body', $pb.PbFieldType.OY)
    ..aOM<$0.Failure>(5, _omitFieldNames ? '' : 'failure',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Reply clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Reply copyWith(void Function(Reply) updates) =>
      super.copyWith((message) => updates(message as Reply)) as Reply;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Reply create() => Reply._();
  @$core.override
  Reply createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Reply getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Reply>(create);
  static Reply? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get invocationId => $_getSZ(0);
  @$pb.TagNumber(1)
  set invocationId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasInvocationId() => $_has(0);
  @$pb.TagNumber(1)
  void clearInvocationId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.int get status => $_getIZ(1);
  @$pb.TagNumber(2)
  set status($core.int value) => $_setUnsignedInt32(1, value);
  @$pb.TagNumber(2)
  $core.bool hasStatus() => $_has(1);
  @$pb.TagNumber(2)
  void clearStatus() => $_clearField(2);

  @$pb.TagNumber(3)
  $pb.PbMap<$core.String, $core.String> get headers => $_getMap(2);

  @$pb.TagNumber(4)
  $core.List<$core.int> get body => $_getN(3);
  @$pb.TagNumber(4)
  set body($core.List<$core.int> value) => $_setBytes(3, value);
  @$pb.TagNumber(4)
  $core.bool hasBody() => $_has(3);
  @$pb.TagNumber(4)
  void clearBody() => $_clearField(4);

  @$pb.TagNumber(5)
  $0.Failure get failure => $_getN(4);
  @$pb.TagNumber(5)
  set failure($0.Failure value) => $_setField(5, value);
  @$pb.TagNumber(5)
  $core.bool hasFailure() => $_has(4);
  @$pb.TagNumber(5)
  void clearFailure() => $_clearField(5);
  @$pb.TagNumber(5)
  $0.Failure ensureFailure() => $_ensure(4);
}

class WorkerApi {
  final $pb.RpcClient _client;

  WorkerApi(this._client);

  $async.Future<Reply> invoke($pb.ClientContext? ctx, Invocation request) =>
      _client.invoke<Reply>(ctx, 'Worker', 'Invoke', request, Reply());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
