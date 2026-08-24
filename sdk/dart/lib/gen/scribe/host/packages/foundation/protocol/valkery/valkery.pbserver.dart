// This is a generated file - do not edit.
//
// Generated from scribe/host/packages/foundation/protocol/valkery/valkery.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'valkery.pb.dart' as $1;
import 'valkery.pbjson.dart';

export 'valkery.pb.dart';

abstract class ValkeryServiceBase extends $pb.GeneratedService {
  $async.Future<$1.GetResult> get($pb.ServerContext ctx, $1.GetRequest request);
  $async.Future<$1.SetResult> set($pb.ServerContext ctx, $1.SetRequest request);
  $async.Future<$1.DeleteResult> delete(
      $pb.ServerContext ctx, $1.DeleteRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Get':
        return $1.GetRequest();
      case 'Set':
        return $1.SetRequest();
      case 'Delete':
        return $1.DeleteRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Get':
        return get(ctx, request as $1.GetRequest);
      case 'Set':
        return set(ctx, request as $1.SetRequest);
      case 'Delete':
        return delete(ctx, request as $1.DeleteRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => ValkeryServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => ValkeryServiceBase$messageJson;
}
