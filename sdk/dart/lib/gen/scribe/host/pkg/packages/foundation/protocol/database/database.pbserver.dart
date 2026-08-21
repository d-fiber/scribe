// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/foundation/protocol/database/database.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'database.pb.dart' as $1;
import 'database.pbjson.dart';

export 'database.pb.dart';

abstract class DatabaseServiceBase extends $pb.GeneratedService {
  $async.Future<$1.QueryResult> execute(
      $pb.ServerContext ctx, $1.Query request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'Execute':
        return $1.Query();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'Execute':
        return execute(ctx, request as $1.Query);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => DatabaseServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => DatabaseServiceBase$messageJson;
}
