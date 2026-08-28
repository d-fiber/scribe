// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/geospatial/protocol/geospatial.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'geospatial.pb.dart' as $1;
import 'geospatial.pbjson.dart';

export 'geospatial.pb.dart';

abstract class GeospatialServiceBase extends $pb.GeneratedService {
  $async.Future<$1.GeocodeResult> geocode(
      $pb.ServerContext ctx, $1.GeocodeRequest request);
  $async.Future<$1.ReverseGeocodeResult> reverseGeocode(
      $pb.ServerContext ctx, $1.ReverseGeocodeRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Geocode':
        return $1.GeocodeRequest();
      case 'ReverseGeocode':
        return $1.ReverseGeocodeRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Geocode':
        return geocode(ctx, request as $1.GeocodeRequest);
      case 'ReverseGeocode':
        return reverseGeocode(ctx, request as $1.ReverseGeocodeRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      GeospatialServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => GeospatialServiceBase$messageJson;
}
