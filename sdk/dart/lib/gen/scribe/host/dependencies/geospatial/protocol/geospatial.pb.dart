// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/geospatial/protocol/geospatial.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class Address extends $pb.GeneratedMessage {
  factory Address({
    $core.String? street,
    $core.String? city,
    $core.String? postalCode,
    $core.String? country,
  }) {
    final result = create();
    if (street != null) result.street = street;
    if (city != null) result.city = city;
    if (postalCode != null) result.postalCode = postalCode;
    if (country != null) result.country = country;
    return result;
  }

  Address._();

  factory Address.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Address.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Address',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'street')
    ..aOS(2, _omitFieldNames ? '' : 'city')
    ..aOS(3, _omitFieldNames ? '' : 'postalCode')
    ..aOS(4, _omitFieldNames ? '' : 'country')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Address clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Address copyWith(void Function(Address) updates) =>
      super.copyWith((message) => updates(message as Address)) as Address;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Address create() => Address._();
  @$core.override
  Address createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Address getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Address>(create);
  static Address? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get street => $_getSZ(0);
  @$pb.TagNumber(1)
  set street($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasStreet() => $_has(0);
  @$pb.TagNumber(1)
  void clearStreet() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get city => $_getSZ(1);
  @$pb.TagNumber(2)
  set city($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasCity() => $_has(1);
  @$pb.TagNumber(2)
  void clearCity() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get postalCode => $_getSZ(2);
  @$pb.TagNumber(3)
  set postalCode($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasPostalCode() => $_has(2);
  @$pb.TagNumber(3)
  void clearPostalCode() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get country => $_getSZ(3);
  @$pb.TagNumber(4)
  set country($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasCountry() => $_has(3);
  @$pb.TagNumber(4)
  void clearCountry() => $_clearField(4);
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
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
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

class GeocodeRequest extends $pb.GeneratedMessage {
  factory GeocodeRequest({
    $core.String? query,
    $core.String? region,
  }) {
    final result = create();
    if (query != null) result.query = query;
    if (region != null) result.region = region;
    return result;
  }

  GeocodeRequest._();

  factory GeocodeRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GeocodeRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GeocodeRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'query')
    ..aOS(2, _omitFieldNames ? '' : 'region')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeocodeRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeocodeRequest copyWith(void Function(GeocodeRequest) updates) =>
      super.copyWith((message) => updates(message as GeocodeRequest))
          as GeocodeRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GeocodeRequest create() => GeocodeRequest._();
  @$core.override
  GeocodeRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GeocodeRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GeocodeRequest>(create);
  static GeocodeRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get query => $_getSZ(0);
  @$pb.TagNumber(1)
  set query($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasQuery() => $_has(0);
  @$pb.TagNumber(1)
  void clearQuery() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get region => $_getSZ(1);
  @$pb.TagNumber(2)
  set region($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRegion() => $_has(1);
  @$pb.TagNumber(2)
  void clearRegion() => $_clearField(2);
}

class GeocodeResult extends $pb.GeneratedMessage {
  factory GeocodeResult({
    Coordinates? coordinates,
    Address? address,
    $0.Failure? error,
  }) {
    final result = create();
    if (coordinates != null) result.coordinates = coordinates;
    if (address != null) result.address = address;
    if (error != null) result.error = error;
    return result;
  }

  GeocodeResult._();

  factory GeocodeResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory GeocodeResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'GeocodeResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
      createEmptyInstance: create)
    ..aOM<Coordinates>(1, _omitFieldNames ? '' : 'coordinates',
        subBuilder: Coordinates.create)
    ..aOM<Address>(2, _omitFieldNames ? '' : 'address',
        subBuilder: Address.create)
    ..aOM<$0.Failure>(3, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeocodeResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  GeocodeResult copyWith(void Function(GeocodeResult) updates) =>
      super.copyWith((message) => updates(message as GeocodeResult))
          as GeocodeResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static GeocodeResult create() => GeocodeResult._();
  @$core.override
  GeocodeResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static GeocodeResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<GeocodeResult>(create);
  static GeocodeResult? _defaultInstance;

  @$pb.TagNumber(1)
  Coordinates get coordinates => $_getN(0);
  @$pb.TagNumber(1)
  set coordinates(Coordinates value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasCoordinates() => $_has(0);
  @$pb.TagNumber(1)
  void clearCoordinates() => $_clearField(1);
  @$pb.TagNumber(1)
  Coordinates ensureCoordinates() => $_ensure(0);

  @$pb.TagNumber(2)
  Address get address => $_getN(1);
  @$pb.TagNumber(2)
  set address(Address value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasAddress() => $_has(1);
  @$pb.TagNumber(2)
  void clearAddress() => $_clearField(2);
  @$pb.TagNumber(2)
  Address ensureAddress() => $_ensure(1);

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

class ReverseGeocodeRequest extends $pb.GeneratedMessage {
  factory ReverseGeocodeRequest({
    Coordinates? coordinates,
  }) {
    final result = create();
    if (coordinates != null) result.coordinates = coordinates;
    return result;
  }

  ReverseGeocodeRequest._();

  factory ReverseGeocodeRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ReverseGeocodeRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ReverseGeocodeRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
      createEmptyInstance: create)
    ..aOM<Coordinates>(1, _omitFieldNames ? '' : 'coordinates',
        subBuilder: Coordinates.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ReverseGeocodeRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ReverseGeocodeRequest copyWith(
          void Function(ReverseGeocodeRequest) updates) =>
      super.copyWith((message) => updates(message as ReverseGeocodeRequest))
          as ReverseGeocodeRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ReverseGeocodeRequest create() => ReverseGeocodeRequest._();
  @$core.override
  ReverseGeocodeRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ReverseGeocodeRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ReverseGeocodeRequest>(create);
  static ReverseGeocodeRequest? _defaultInstance;

  @$pb.TagNumber(1)
  Coordinates get coordinates => $_getN(0);
  @$pb.TagNumber(1)
  set coordinates(Coordinates value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasCoordinates() => $_has(0);
  @$pb.TagNumber(1)
  void clearCoordinates() => $_clearField(1);
  @$pb.TagNumber(1)
  Coordinates ensureCoordinates() => $_ensure(0);
}

class ReverseGeocodeResult extends $pb.GeneratedMessage {
  factory ReverseGeocodeResult({
    Address? address,
    $0.Failure? error,
  }) {
    final result = create();
    if (address != null) result.address = address;
    if (error != null) result.error = error;
    return result;
  }

  ReverseGeocodeResult._();

  factory ReverseGeocodeResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ReverseGeocodeResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ReverseGeocodeResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.geospatial.v1'),
      createEmptyInstance: create)
    ..aOM<Address>(1, _omitFieldNames ? '' : 'address',
        subBuilder: Address.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ReverseGeocodeResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ReverseGeocodeResult copyWith(void Function(ReverseGeocodeResult) updates) =>
      super.copyWith((message) => updates(message as ReverseGeocodeResult))
          as ReverseGeocodeResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ReverseGeocodeResult create() => ReverseGeocodeResult._();
  @$core.override
  ReverseGeocodeResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ReverseGeocodeResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ReverseGeocodeResult>(create);
  static ReverseGeocodeResult? _defaultInstance;

  @$pb.TagNumber(1)
  Address get address => $_getN(0);
  @$pb.TagNumber(1)
  set address(Address value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasAddress() => $_has(0);
  @$pb.TagNumber(1)
  void clearAddress() => $_clearField(1);
  @$pb.TagNumber(1)
  Address ensureAddress() => $_ensure(0);

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

class GeospatialApi {
  final $pb.RpcClient _client;

  GeospatialApi(this._client);

  $async.Future<GeocodeResult> geocode(
          $pb.ClientContext? ctx, GeocodeRequest request) =>
      _client.invoke<GeocodeResult>(
          ctx, 'Geospatial', 'Geocode', request, GeocodeResult());
  $async.Future<ReverseGeocodeResult> reverseGeocode(
          $pb.ClientContext? ctx, ReverseGeocodeRequest request) =>
      _client.invoke<ReverseGeocodeResult>(
          ctx, 'Geospatial', 'ReverseGeocode', request, ReverseGeocodeResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
