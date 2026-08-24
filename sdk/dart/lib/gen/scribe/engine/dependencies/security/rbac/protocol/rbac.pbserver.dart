// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/security/rbac/protocol/rbac.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'rbac.pb.dart' as $2;
import 'rbac.pbjson.dart';

export 'rbac.pb.dart';

abstract class RbacServiceBase extends $pb.GeneratedService {
  $async.Future<$2.RulesResult> getRules(
      $pb.ServerContext ctx, $2.RulesRequest request);
  $async.Future<$2.PermissionResult> hasPermission(
      $pb.ServerContext ctx, $2.PermissionRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'GetRules':
        return $2.RulesRequest();
      case 'HasPermission':
        return $2.PermissionRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'GetRules':
        return getRules(ctx, request as $2.RulesRequest);
      case 'HasPermission':
        return hasPermission(ctx, request as $2.PermissionRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json => RbacServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => RbacServiceBase$messageJson;
}
