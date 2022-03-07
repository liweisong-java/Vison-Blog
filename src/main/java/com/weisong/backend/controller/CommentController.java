package com.weisong.backend.controller;


import com.weisong.backend.entities.Comment;
import com.weisong.backend.service.CommentService;
import com.weisong.backend.util.Result.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping(value = "/comment")
public class CommentController {

    @Autowired
    CommentService commentService;

    @GetMapping(value = "/{articleUuid}")
    public Result getLoadingByArticleUuid(@PathVariable("articleUuid")String articleUuid){
        return Result.success(commentService.getCommentByArticleUuid(articleUuid));
    }
}
